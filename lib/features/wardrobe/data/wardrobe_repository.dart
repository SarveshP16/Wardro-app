import 'package:hive/hive.dart';

import '../../../core/storage/hive_boxes.dart';
import '../../../core/storage/image_file_store.dart';
import '../domain/clothing_item.dart';

/// The single source of truth for wardrobe items: reads/writes the Hive
/// box and keeps each item's cutout image file on disk in sync with its
/// metadata (e.g. deleting an item also deletes its image file).
class WardrobeRepository {
  WardrobeRepository(this._box);

  final Box<Map> _box;

  List<ClothingItem> getAll() {
    final items = _box.values.map(ClothingItem.fromMap).toList();
    items.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return items;
  }

  Future<void> add(ClothingItem item) async {
    await _box.put(item.id, item.toMap());
  }

  Future<void> update(ClothingItem item) async {
    await _box.put(item.id, item.toMap());
  }

  Future<void> delete(String id) async {
    final map = _box.get(id);
    if (map != null) {
      await ImageFileStore.delete(ClothingItem.fromMap(map).imagePath);
    }
    await _box.delete(id);
  }

  static WardrobeRepository openDefault() {
    return WardrobeRepository(Hive.box<Map>(HiveBoxes.wardrobeItems));
  }
}
