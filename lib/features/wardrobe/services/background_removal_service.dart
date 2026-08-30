import 'dart:typed_data';

import 'package:local_rembg/local_rembg.dart';

/// Thrown when on-device background removal fails (unsupported image,
/// model error, etc.) so callers can show a friendly message instead of
/// a raw plugin error.
class BackgroundRemovalException implements Exception {
  BackgroundRemovalException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Wraps the `local_rembg` plugin behind a small interface. Isolating it
/// here (rather than calling `LocalRembg` directly from the UI) means
/// swapping the underlying model/package later — e.g. for higher quality
/// or the future cloud-based multi-item detector — only touches this file.
abstract class BackgroundRemovalService {
  Future<Uint8List> removeBackground(String imagePath);
}

class LocalRembgBackgroundRemovalService implements BackgroundRemovalService {
  @override
  Future<Uint8List> removeBackground(String imagePath) async {
    final result = await LocalRembg.removeBackground(imagePath: imagePath);
    if (result.status != 1 || result.imageBytes == null) {
      throw BackgroundRemovalException(
        result.errorMessage ?? 'Could not remove the background from this photo.',
      );
    }
    return Uint8List.fromList(result.imageBytes!);
  }
}
