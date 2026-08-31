import 'dart:math' as math;

import 'package:flutter/painting.dart' show Color, HSLColor;

/// Lightweight color-theory scoring for the free on-device "Quick Match"
/// outfit generator. Deliberately simple (no full color-wheel taxonomy,
/// no pattern awareness) — good enough to rank candidate combinations,
/// not a substitute for the AI Stylist's actual visual judgment.
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

  /// A short human-readable label for why two colors were paired, for the
  /// generated outfit's title/rationale.
  static String describe(Color a, Color b) {
    final aNeutral = isNeutral(a);
    final bNeutral = isNeutral(b);
    if (aNeutral && bNeutral) {
      return 'Timeless neutrals';
    }
    if (aNeutral || bNeutral) {
      return 'Neutral base with a pop of color';
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
