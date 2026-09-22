import sharp from "sharp";
import { packRgb } from "./color";

/// Server-side port of `dominant_color_extractor.dart` — the wardrobe
/// item's dominant color is the average RGB of its background-removed
/// cutout's opaque pixels. Computed once, right after the rembg sidecar
/// returns the cutout (see app/api/wardrobe/items/process/route.ts), and
/// cached on the ClothingItem row so the client-side Quick Match matcher
/// never has to re-decode the image.
///
/// A plain average washes out multi-color prints/patterns into a muddy
/// blend, which is a real accuracy limitation — acceptable for a fast
/// heuristic; the AI Stylist (which looks at the actual image) doesn't
/// have this limitation.

/// Downscale before sampling — a garment's average color doesn't need
/// full resolution, and this keeps the pixel loop trivially fast
/// regardless of the source camera resolution.
const SAMPLE_DIMENSION = 64;
const ALPHA_THRESHOLD = 128;
const FALLBACK_NEUTRAL = 0x9e9e9e;

export async function extractDominantColor(
  pngBytes: Buffer,
): Promise<number> {
  const { data, info } = await sharp(pngBytes)
    .resize(SAMPLE_DIMENSION)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;
  let opaqueCount = 0;

  for (let i = 0; i < data.length; i += channels) {
    const alpha = data[i + 3];
    if (alpha < ALPHA_THRESHOLD) continue;
    redSum += data[i];
    greenSum += data[i + 1];
    blueSum += data[i + 2];
    opaqueCount++;
  }

  if (opaqueCount === 0) return FALLBACK_NEUTRAL;
  return packRgb(
    Math.round(redSum / opaqueCount),
    Math.round(greenSum / opaqueCount),
    Math.round(blueSum / opaqueCount),
  );
}
