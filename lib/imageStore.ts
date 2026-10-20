import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

/// Saves/reads/deletes the cutout PNGs that back each ClothingItem, on
/// disk under IMAGES_DIR. The database
/// only ever stores the item's id; the image filename is always
/// `<id>.png`, so there's no separate path to persist or drift out of
/// sync (see prisma/schema.prisma).
///
/// In Docker this directory is the `wardrobe-images` volume, mounted at
/// /app/data/images (see docker-compose.yml). For local dev outside
/// Docker it defaults to ./data/images, which is gitignored.
const IMAGES_DIR =
  process.env.IMAGES_DIR ?? path.join(process.cwd(), "data", "images");

async function ensureDir(): Promise<void> {
  await mkdir(IMAGES_DIR, { recursive: true });
}

function pathFor(id: string): string {
  return path.join(IMAGES_DIR, `${id}.png`);
}

export async function saveImage(id: string, bytes: Buffer): Promise<void> {
  await ensureDir();
  await writeFile(pathFor(id), bytes);
}

export async function readImage(id: string): Promise<Buffer> {
  return readFile(pathFor(id));
}

/// Longest side of the display copies -- enough for a full-width phone
/// screen at 3x density.
const DISPLAY_MAX_SIZE = 1000;

function displayPathFor(id: string): string {
  return path.join(IMAGES_DIR, "display", `${id}.webp`);
}

/// The cutout as the UI shows it: cropped to the garment's own bounds and
/// shrunk to a display size, as WebP. rembg keeps the original photo's
/// full-resolution canvas (often ~4 MB per PNG, with a pair of shoes
/// sitting small in a big transparent frame); trimming lets every garment
/// fill its tile and makes the outfit flat-lay's positioning predictable,
/// and the downscale keeps the wardrobe grid fast over Tailscale.
/// Generated on first request and cached beside the originals, which are
/// never modified (the AI Stylist still reads those via readImage).
export async function readDisplayImage(id: string): Promise<Buffer> {
  try {
    return await readFile(displayPathFor(id));
  } catch {
    // Not cached yet -- fall through and generate it.
  }
  const original = await readImage(id);
  const resize = {
    width: DISPLAY_MAX_SIZE,
    height: DISPLAY_MAX_SIZE,
    fit: "inside",
    withoutEnlargement: true,
  } as const;
  let display: Buffer;
  try {
    display = await sharp(original)
      .trim()
      .resize(resize)
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    // Nothing to trim (e.g. a fully transparent image) -- just shrink it.
    display = await sharp(original)
      .resize(resize)
      .webp({ quality: 82 })
      .toBuffer();
  }
  await mkdir(path.dirname(displayPathFor(id)), { recursive: true });
  await writeFile(displayPathFor(id), display);
  return display;
}

export async function deleteImage(id: string): Promise<void> {
  await rm(pathFor(id), { force: true });
  await rm(displayPathFor(id), { force: true });
}
