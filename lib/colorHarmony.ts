import { hslOf } from "./color";
import { isPaired, nearestName } from "./sanzoWadaPalette";

/// Port of `color_harmony.dart` — color-theory scoring for the free
/// on-device "Quick Match" outfit generator: a synthetic hue-distance
/// model (no pattern awareness, not a substitute for the AI Stylist's
/// actual visual judgment) blended with sanzoWadaPalette's curated,
/// real-world color pairings.

/// A color reads as "neutral" (goes with almost anything) when it's close
/// to grayscale (low saturation) or near black/white (extreme lightness)
/// — covers black, white, gray, navy-adjacent darks, beige.
export function isNeutral(color: number): boolean {
  const { s, l } = hslOf(color);
  return s < 0.18 || l < 0.14 || l > 0.92;
}

/// Circular hue distance in degrees, always in [0, 180].
function hueDistance(hueA: number, hueB: number): number {
  const diff = Math.abs(hueA - hueB) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/// 0..1 compatibility score for two colors. Neutrals score high with
/// anything. Otherwise, scores by hue relationship: analogous (close
/// hues) and complementary (opposite hues) score high, with the lowest
/// score at a ~90 degree hue gap -- a smooth stand-in for "these two
/// specific hues clash."
export function score(a: number, b: number): number {
  const aNeutral = isNeutral(a);
  const bNeutral = isNeutral(b);
  if (aNeutral && bNeutral) return 0.95;
  if (aNeutral || bNeutral) return 0.85;

  const diff = hueDistance(hslOf(a).h, hslOf(b).h);
  const radians = (diff * Math.PI) / 180;
  return 0.5 + 0.5 * Math.cos(2 * radians);
}

/// [score], boosted when [a] and [b] snap to two Sanzo Wada reference
/// colors he actually published together — real curated precedent
/// outranks the synthetic hue-distance estimate, including for hue gaps
/// the geometric model alone would score as "clashing".
export function hybridScore(a: number, b: number): number {
  const geometric = score(a, b);
  if (isNeutral(a) || isNeutral(b)) return geometric;
  return isPaired(a, b) ? Math.max(geometric, 0.97) : geometric;
}

/// A short human-readable label for why two colors were paired, for the
/// generated outfit's title/rationale. Names the actual Sanzo Wada
/// reference colors when they were a real published pairing.
export function describe(a: number, b: number): string {
  const aNeutral = isNeutral(a);
  const bNeutral = isNeutral(b);
  if (aNeutral && bNeutral) return "Timeless neutrals";
  if (aNeutral || bNeutral) return "Neutral base with a pop of color";
  if (isPaired(a, b)) {
    return `Classic pairing: ${nearestName(a)} & ${nearestName(b)}`;
  }
  const diff = hueDistance(hslOf(a).h, hslOf(b).h);
  if (diff > 150) return "Complementary colors";
  if (diff < 40) return "Analogous tones";
  return "Color-matched outfit";
}
