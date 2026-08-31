import 'package:hive/hive.dart';

import '../../../core/storage/hive_boxes.dart';
import '../domain/saved_outfit.dart';

/// Reads/writes saved outfits — the same Hive-backed pattern as
/// `WardrobeRepository`, just for a different box.
class OutfitRepository {
  OutfitRepository(this._box);

  final Box<Map> _box;

  List<SavedOutfit> getAll() {
    final outfits = _box.values.map(SavedOutfit.fromMap).toList();
    outfits.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return outfits;
  }

  Future<void> add(SavedOutfit outfit) async {
    await _box.put(outfit.id, outfit.toMap());
  }

  Future<void> delete(String id) async {
    await _box.delete(id);
  }

  static OutfitRepository openDefault() {
    return OutfitRepository(Hive.box<Map>(HiveBoxes.savedOutfits));
  }
}
