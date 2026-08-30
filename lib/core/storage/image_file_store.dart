import 'dart:io';
import 'dart:typed_data';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// Saves and deletes the cutout PNGs that back each [ClothingItem] on
/// disk, under the app's documents directory. Hive only ever stores the
/// resulting file *path* — never the image bytes themselves — so the
/// database stays small and images can be viewed/managed with normal
/// file APIs.
class ImageFileStore {
  ImageFileStore._();

  static const _subdirectory = 'wardrobe_images';

  static Future<Directory> _directory() async {
    final documents = await getApplicationDocumentsDirectory();
    final directory = Directory(p.join(documents.path, _subdirectory));
    if (!await directory.exists()) {
      await directory.create(recursive: true);
    }
    return directory;
  }

  /// Writes [bytes] as a new PNG named after [id] and returns its path.
  static Future<String> save({
    required String id,
    required Uint8List bytes,
  }) async {
    final directory = await _directory();
    final file = File(p.join(directory.path, '$id.png'));
    await file.writeAsBytes(bytes, flush: true);
    return file.path;
  }

  static Future<void> delete(String imagePath) async {
    final file = File(imagePath);
    if (await file.exists()) {
      await file.delete();
    }
  }
}
