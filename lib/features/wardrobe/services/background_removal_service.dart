import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:image_background_remover/image_background_remover.dart';

/// Thrown when on-device background removal fails (unsupported image,
/// model error, etc.) so callers can show a friendly message instead of
/// a raw plugin error.
class BackgroundRemovalException implements Exception {
  BackgroundRemovalException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Wraps whichever on-device background-removal package Wardro currently
/// uses behind a small interface. Isolating it here — rather than calling
/// the plugin directly from the UI — is what let the app swap from
/// `local_rembg` to `image_background_remover` after `local_rembg`'s
/// DeepLabV3 model proved too inaccurate on real clothing/shoe photos
/// (see project memory) without touching a single screen.
abstract class BackgroundRemovalService {
  Future<Uint8List> removeBackground(String imagePath);
}

/// Backed by `image_background_remover` (an ONNX-runtime salient-object
/// segmentation model bundled with the app, run fully on-device).
/// [OnnxBackgroundRemoverInitializer.ensureInitialized] must have
/// succeeded before this is used — see its doc comment.
class OnnxBackgroundRemovalService implements BackgroundRemovalService {
  @override
  Future<Uint8List> removeBackground(String imagePath) async {
    try {
      final inputBytes = await File(imagePath).readAsBytes();
      final ui.Image resultImage = await BackgroundRemover.instance.removeBg(
        inputBytes,
      );
      final byteData = await resultImage.toByteData(
        format: ui.ImageByteFormat.png,
      );
      if (byteData == null) {
        throw BackgroundRemovalException(
          'Could not process this photo. Please try again.',
        );
      }
      return byteData.buffer.asUint8List();
    } on BackgroundRemovalException {
      rethrow;
    } catch (_) {
      throw BackgroundRemovalException(
        'Could not remove the background from this photo.',
      );
    }
  }
}

/// `image_background_remover` needs its ONNX runtime loaded once before
/// any [OnnxBackgroundRemovalService.removeBackground] call — done at app
/// startup in `main.dart`, alongside `LocalStorageService.init()`.
class OnnxBackgroundRemoverInitializer {
  OnnxBackgroundRemoverInitializer._();

  static Future<void> ensureInitialized() {
    return BackgroundRemover.instance.initializeOrt();
  }
}
