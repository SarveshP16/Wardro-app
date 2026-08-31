import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/painting.dart' show Color;

/// Computes a wardrobe item's dominant color from its background-removed
/// cutout — the average RGB of its opaque pixels. Powers the free
/// on-device "Quick Match" outfit generator (see
/// `outfits/services/color_match_outfit_generation_service.dart`), which
/// needs a representative color per item but not a full palette.
///
/// A plain average washes out multi-color prints/patterns into a muddy
/// blend, which is a real accuracy limitation — acceptable for a fast,
/// free heuristic; the paid AI Stylist (which looks at the actual image)
/// doesn't have this limitation.
class DominantColorExtractor {
  DominantColorExtractor._();

  /// Downscale before sampling — a garment's average color doesn't need
  /// full resolution, and this keeps the pixel loop trivially fast
  /// regardless of the source camera resolution.
  static const _sampleDimension = 64;
  static const _alphaThreshold = 128;

  static Future<Color> extract(Uint8List pngBytes) async {
    final codec = await ui.instantiateImageCodec(
      pngBytes,
      targetWidth: _sampleDimension,
    );
    final frame = await codec.getNextFrame();
    final byteData = await frame.image.toByteData(
      format: ui.ImageByteFormat.rawRgba,
    );
    if (byteData == null) return const Color(0xFF9E9E9E);

    final pixels = byteData.buffer.asUint8List();
    int redSum = 0, greenSum = 0, blueSum = 0, opaqueCount = 0;

    for (var i = 0; i < pixels.length; i += 4) {
      final alpha = pixels[i + 3];
      if (alpha < _alphaThreshold) continue;
      redSum += pixels[i];
      greenSum += pixels[i + 1];
      blueSum += pixels[i + 2];
      opaqueCount++;
    }

    if (opaqueCount == 0) return const Color(0xFF9E9E9E);
    return Color.fromARGB(
      255,
      redSum ~/ opaqueCount,
      greenSum ~/ opaqueCount,
      blueSum ~/ opaqueCount,
    );
  }
}
