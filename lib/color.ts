/// Small packed-RGB helpers shared by dominantColor.ts, colorHarmony.ts,
/// and sanzoWadaPalette.ts. Colors are represented as a single packed
/// 0xRRGGBB int throughout (analogous to Dart's `Color.toARGB32()`, minus
/// the alpha byte since every dominant color here is fully opaque).

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number; // 0..360
  s: number; // 0..1
  l: number; // 0..1
}

export function packRgb(r: number, g: number, b: number): number {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

export function unpackRgb(color: number): Rgb {
  return {
    r: (color >> 16) & 0xff,
    g: (color >> 8) & 0xff,
    b: color & 0xff,
  };
}

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return { h: h * 60, s, l };
}

export function hslOf(color: number): Hsl {
  const { r, g, b } = unpackRgb(color);
  return rgbToHsl(r, g, b);
}

/// #rrggbb string, for use in inline styles.
export function toHex(color: number): string {
  return `#${(color & 0xffffff).toString(16).padStart(6, "0")}`;
}
