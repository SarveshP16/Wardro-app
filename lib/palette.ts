import sharp from "sharp";

import { Prisma } from "@prisma/client";

import { prisma } from "./db";
import { readImage } from "./imageStore";
import { deltaE, labToPacked, rgbToLab, type Lab } from "./oklab";
import type { PaletteColor } from "./types";

/// A wardrobe piece's main colours -- up to 3, with each one's share of
/// the garment -- found by k-means clustering its cutout's pixels in OKLab.
/// Unlike the single average in lib/dominantColor.ts (kept as is), a print
/// keeps its colours instead of averaging to mud. Server-only.

/// Sampled with nearest-neighbour scaling: ordinary resizing blends
/// neighbouring pixels, which averages a fine print into mush before
/// clustering even starts.
const SAMPLE_DIMENSION = 128;
const ALPHA_THRESHOLD = 200;
const CLUSTERS = 5;
const ITERATIONS = 12;
const MAX_COLOURS = 3;
/// Clusters closer than this are the same colour in light and shadow;
/// lightness differences count half, since folds and shading mostly
/// change lightness.
const MERGE_DISTANCE = 0.07;
/// Colours covering less of the piece than this are details (buttons,
/// labels, stitching), not part of its palette.
const MIN_SHARE = 0.1;

/// Greys, whites and blacks in shadow vs. light: below this chroma two
/// clusters within NEUTRAL_LIGHTNESS_SPAN of each other are one colour
/// (white sneakers photographed in shade), while black vs. white stays two.
const NEUTRAL_CHROMA = 0.045;
const NEUTRAL_LIGHTNESS_SPAN = 0.3;

function isShadingOf(x: Lab, y: Lab): boolean {
  const neutral = (c: Lab) => Math.hypot(c.a, c.b) < NEUTRAL_CHROMA;
  if (neutral(x) && neutral(y)) return Math.abs(x.L - y.L) < NEUTRAL_LIGHTNESS_SPAN;
  return Math.hypot((x.L - y.L) * 0.5, x.a - y.a, x.b - y.b) < MERGE_DISTANCE;
}

export async function extractPalette(pngBytes: Buffer): Promise<PaletteColor[]> {
  const { data, info } = await sharp(pngBytes)
    .resize(SAMPLE_DIMENSION, SAMPLE_DIMENSION, { fit: "inside", kernel: "nearest" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const points: Lab[] = [];
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < ALPHA_THRESHOLD) continue;
    points.push(rgbToLab(data[i], data[i + 1], data[i + 2]));
  }
  if (points.length === 0) return [];

  // Deterministic seeding from the most common colours: bucket the pixels
  // on a coarse OKLab grid and start a cluster at each of the fullest
  // buckets that isn't too close to one already chosen -- robust to stray
  // pixels (labels, specks), which a "farthest pixel" start would chase.
  const buckets = new Map<string, { sum: Lab; count: number }>();
  for (const p of points) {
    const key = `${Math.round(p.L * 8)},${Math.round(p.a * 20)},${Math.round(p.b * 20)}`;
    const bucket = buckets.get(key) ?? { sum: { L: 0, a: 0, b: 0 }, count: 0 };
    bucket.sum.L += p.L;
    bucket.sum.a += p.a;
    bucket.sum.b += p.b;
    bucket.count++;
    buckets.set(key, bucket);
  }
  const centres: Lab[] = [];
  for (const { sum, count } of [...buckets.values()].sort((x, y) => y.count - x.count)) {
    const centre = { L: sum.L / count, a: sum.a / count, b: sum.b / count };
    if (centres.every((c) => deltaE(c, centre) > MERGE_DISTANCE)) centres.push(centre);
    if (centres.length === CLUSTERS) break;
  }

  // Lloyd's iterations.
  let assignment = new Array<number>(points.length).fill(0);
  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    assignment = points.map((p) => {
      let bestIndex = 0;
      for (let k = 1; k < centres.length; k++) {
        if (deltaE(p, centres[k]) < deltaE(p, centres[bestIndex])) bestIndex = k;
      }
      return bestIndex;
    });
    for (let k = 0; k < centres.length; k++) {
      const members = points.filter((_, i) => assignment[i] === k);
      if (members.length === 0) continue;
      centres[k] = {
        L: members.reduce((s, p) => s + p.L, 0) / members.length,
        a: members.reduce((s, p) => s + p.a, 0) / members.length,
        b: members.reduce((s, p) => s + p.b, 0) / members.length,
      };
    }
  }

  let clusters = centres.map((centre, k) => ({
    centre,
    weight: assignment.filter((a) => a === k).length / points.length,
  }));

  // Merge shading variants of the same colour, heaviest first.
  clusters.sort((x, y) => y.weight - x.weight);
  const merged: typeof clusters = [];
  for (const cluster of clusters) {
    const twin = merged.find((m) => isShadingOf(m.centre, cluster.centre));
    if (twin) {
      const total = twin.weight + cluster.weight;
      twin.centre = {
        L: (twin.centre.L * twin.weight + cluster.centre.L * cluster.weight) / total,
        a: (twin.centre.a * twin.weight + cluster.centre.a * cluster.weight) / total,
        b: (twin.centre.b * twin.weight + cluster.centre.b * cluster.weight) / total,
      };
      twin.weight = total;
    } else {
      merged.push({ ...cluster });
    }
  }
  clusters = merged
    .filter((c) => c.weight >= MIN_SHARE)
    .sort((x, y) => y.weight - x.weight)
    .slice(0, MAX_COLOURS);

  const total = clusters.reduce((s, c) => s + c.weight, 0);
  return clusters.map((c) => ({
    color: labToPacked(c.centre),
    weight: Math.round((c.weight / total) * 100) / 100,
  }));
}

/// Fills in palettes for pieces saved before palettes existed. Started
/// once per server start (instrumentation.ts) and runs in the background,
/// one piece at a time; a piece that fails is skipped (Quick Match falls
/// back to its average colour) and retried on the next start.
export async function backfillPalettes(): Promise<void> {
  const pending = await prisma.clothingItem.findMany({
    where: { palette: { equals: Prisma.DbNull } },
    select: { id: true },
  });
  if (pending.length === 0) return;
  let done = 0;
  for (const { id } of pending) {
    try {
      const palette = await extractPalette(await readImage(id));
      await prisma.clothingItem.update({
        where: { id },
        data: { palette: palette as unknown as Prisma.InputJsonValue },
      });
      done++;
    } catch {
      // Missing or unreadable image -- leave it for next time.
    }
  }
  console.log(`palette backfill: ${done}/${pending.length} pieces`);
}
