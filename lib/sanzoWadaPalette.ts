import rawPalette from "@/data/sanzo_wada_colors.json";

/// Port of `sanzo_wada_palette.dart`. Looks up whether two colors
/// correspond to a pairing Sanzo Wada actually published together, by
/// snapping each to its nearest of his 159 reference colors (plain RGB
/// distance — not perceptually exact, but adequate for a "does this look
/// like a real pairing" check) and checking whether those two reference
/// colors share a palette. See data/sanzo_wada_colors.LICENSE.md for the
/// dataset's source and license.
///
/// Supplements (never fully replaces) colorHarmony's geometric
/// hue-distance scoring — a real, curated color reference plus a
/// synthetic fallback for combinations Wada never happened to publish.

interface Entry {
  name: string;
  r: number;
  g: number;
  b: number;
  combinations: Set<number>;
}

interface RawEntry {
  name: string;
  rgb: [number, number, number];
  combinations: number[];
}

const entries: Entry[] = (rawPalette as unknown as RawEntry[]).map((item) => ({
  name: item.name,
  r: item.rgb[0],
  g: item.rgb[1],
  b: item.rgb[2],
  combinations: new Set(item.combinations),
}));

const nearestCache = new Map<number, Entry>();

function distanceSquared(r: number, g: number, b: number, entry: Entry) {
  const dr = r - entry.r;
  const dg = g - entry.g;
  const db = b - entry.b;
  return dr * dr + dg * dg + db * db;
}

/// [color] is a packed 0xRRGGBB int (see lib/color.ts).
function nearest(color: number): Entry {
  const cached = nearestCache.get(color);
  if (cached) return cached;

  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  let best = entries[0];
  let bestDistance = distanceSquared(r, g, b, best);
  for (let i = 1; i < entries.length; i++) {
    const distance = distanceSquared(r, g, b, entries[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entries[i];
    }
  }
  nearestCache.set(color, best);
  return best;
}

/// True if [a] and [b]'s nearest reference colors were published together
/// in at least one of Wada's palettes (or are the same reference color).
export function isPaired(a: number, b: number): boolean {
  const entryA = nearest(a);
  const entryB = nearest(b);
  if (entryA === entryB) return true;
  for (const id of entryA.combinations) {
    if (entryB.combinations.has(id)) return true;
  }
  return false;
}

/// The evocative name Wada gave the reference color nearest to [color]
/// (e.g. "Hermosa Pink") — used to flavor a Quick Match outfit's
/// rationale text.
export function nearestName(color: number): string {
  return nearest(color).name;
}
