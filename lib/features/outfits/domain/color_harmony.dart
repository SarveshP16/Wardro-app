import 'dart:math' as math;

import 'package:flutter/painting.dart' show Color, HSLColor;

import 'sanzo_wada_palette.dart';

/// Color-theory scoring for the free on-device "Quick Match" outfit
/// generator: a synthetic hue-distance model (no pattern awareness, not a
/// substitute for the AI Stylist's actual visual judgment) blended with
/// [SanzoWadaPalette]'s curated, real-world color pairings.
class ColorHarmony {
  ColorHarmony._();

  /// A color reads as "neutral" (goes with almost anything) when it's
  /// close to grayscale (low saturation) or near black/white (extreme
  /// lightness) — covers black, white, gray, navy-adjacent darks, beige.
  static bool isNeutral(Color color) {
    final hsl = HSLColor.fromColor(color);
    return hsl.saturation < 0.18 || hsl.lightness < 0.14 || hsl.lightness > 0.92;
  }

  /// 0..1 compatibility score for two colors. Neutrals score high with
  /// anything. Otherwise, scores by hue relationship: analogous (close
  /// hues) and complementary (opposite hues) score high, with the lowest
  /// score at a ~90 degree hue gap -- a smooth stand-in for "these two
  /// specific hues clash."
  static double score(Color a, Color b) {
    final aNeutral = isNeutral(a);
    final bNeutral = isNeutral(b);
    if (aNeutral && bNeutral) return 0.95;
    if (aNeutral || bNeutral) return 0.85;

    final hueA = HSLColor.fromColor(a).hue;
    final hueB = HSLColor.fromColor(b).hue;
    final diff = _hueDistance(hueA, hueB); // 0..180
    final radians = diff * math.pi / 180;
    return 0.5 + 0.5 * math.cos(2 * radians);
  }

  /// [score], boosted when [a] and [b] snap to two Sanzo Wada reference
  /// colors he actually published together — real curated precedent
  /// outranks the synthetic hue-distance estimate, including for hue
  /// gaps the geometric model alone would score as "clashing".
  static double hybridScore(Color a, Color b, SanzoWadaPalette palette) {
    final geometric = score(a, b);
    if (isNeutral(a) || isNeutral(b)) return geometric;
    return palette.isPaired(a, b) ? math.max(geometric, 0.97) : geometric;
  }

  /// A short human-readable label for why two colors were paired, for the
  /// generated outfit's title/rationale. When [palette] confirms a real
  /// Sanzo Wada pairing, names the actual reference colors instead of the
  /// generic geometric description.
  static String describe(Color a, Color b, {SanzoWadaPalette? palette}) {
    final aNeutral = isNeutral(a);
    final bNeutral = isNeutral(b);
    if (aNeutral && bNeutral) {
      return 'Timeless neutrals';
    }
    if (aNeutral || bNeutral) {
      return 'Neutral base with a pop of color';
    }
    if (palette != null && palette.isPaired(a, b)) {
      final nameA = palette.nearestName(a);
      final nameB = palette.nearestName(b);
      return 'Classic pairing: $nameA & $nameB';
    }
    final diff = _hueDistance(HSLColor.fromColor(a).hue, HSLColor.fromColor(b).hue);
    if (diff > 150) return 'Complementary colors';
    if (diff < 40) return 'Analogous tones';
    return 'Color-matched outfit';
  }

  /// Circular hue distance in degrees, always in [0, 180].
  static double _hueDistance(double hueA, double hueB) {
    final diff = (hueA - hueB).abs() % 360;
    return diff > 180 ? 360 - diff : diff;
  }
}
