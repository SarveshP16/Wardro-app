import { hslOf } from "./color";

/// Plain-language names and a spectrum ordering for garments' dominant
/// colors -- used by the Colour story look (the wardrobe spectrum strip,
/// "sort by colour", and each outfit's colour band caption). Deliberately
/// coarse: these describe clothes ("navy", "stone"), not paint chips.

/// Below this saturation a color reads as a neutral (black/grey/stone).
const NEUTRAL_SATURATION = 0.15;

export function colorName(color: number): string {
  const { h, s, l } = hslOf(color);

  if (l < 0.1) return "black";
  if (l > 0.9) return "white";

  if (s < NEUTRAL_SATURATION) {
    const tinted = s > 0.04;
    const warm = tinted && (h < 75 || h >= 340);
    const cool = tinted && h >= 180 && h < 260;
    if (l < 0.15) return "black";
    if (l < 0.28) return cool && s > 0.1 ? "navy" : "charcoal";
    if (l > 0.78) return warm ? "cream" : "off-white";
    if (warm) {
      if (l < 0.4 && s > 0.12) return "brown";
      return l < 0.47 ? "taupe" : "stone";
    }
    if (cool) return "slate";
    return "grey";
  }

  if (h < 12 || h >= 345) {
    if (l < 0.3) return "burgundy";
    return l > 0.7 ? "pink" : "red";
  }
  if (h < 40) {
    if (l < 0.32) return "brown";
    if (l > 0.72) return "peach";
    if (s < 0.45) return l < 0.5 ? "brown" : "tan";
    return l < 0.5 ? "rust" : "orange";
  }
  if (h < 65) {
    if (l < 0.38) return "olive";
    if (s < 0.4) return l > 0.65 ? "beige" : "khaki";
    return "mustard";
  }
  if (h < 160) {
    if (h < 90 && l < 0.45) return "olive";
    if (l < 0.28) return "forest";
    return s < 0.3 ? "sage" : "green";
  }
  if (h < 200) return "teal";
  if (h < 250) {
    if (l < 0.32) return "navy";
    if (l > 0.72) return "light blue";
    return s < 0.3 ? "slate" : "blue";
  }
  if (h < 290) {
    if (l < 0.3) return "plum";
    return l > 0.7 ? "lavender" : "purple";
  }
  return l < 0.35 ? "plum" : "pink";
}

/// "Stone, oat and navy"-style caption for a set of colors, in order,
/// without repeats.
export function colorStoryCaption(colors: number[]): string {
  const names = [...new Set(colors.map(colorName))];
  if (names.length === 0) return "";
  const text =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/// Sort comparator laying colors out as a spectrum: chromatic colors by
/// hue (reds first), then neutrals from light to dark. Items without a
/// color go last.
export function compareByColor(a: number | null, b: number | null): number {
  if (a === null || b === null) {
    return a === b ? 0 : a === null ? 1 : -1;
  }
  const x = hslOf(a);
  const y = hslOf(b);
  const xNeutral = x.s < NEUTRAL_SATURATION || x.l < 0.1;
  const yNeutral = y.s < NEUTRAL_SATURATION || y.l < 0.1;
  if (xNeutral !== yNeutral) return xNeutral ? 1 : -1;
  if (xNeutral) return y.l - x.l;
  // Rotate the hue wheel so reds (~345°+) start the spectrum.
  const hx = (x.h + 15) % 360;
  const hy = (y.h + 15) % 360;
  return hx - hy || y.l - x.l;
}
