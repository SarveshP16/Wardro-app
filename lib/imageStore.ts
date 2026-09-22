import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

/// Saves/reads/deletes the cutout PNGs that back each ClothingItem, on
/// disk under IMAGES_DIR — port of `image_file_store.dart`. The database
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

export async function deleteImage(id: string): Promise<void> {
  await rm(pathFor(id), { force: true });
}
