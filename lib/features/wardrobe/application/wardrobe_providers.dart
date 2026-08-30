import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/wardrobe_repository.dart';
import '../domain/clothing_category.dart';
import '../domain/clothing_item.dart';
import '../services/background_removal_service.dart';

final wardrobeRepositoryProvider = Provider<WardrobeRepository>((ref) {
  return WardrobeRepository.openDefault();
});

final backgroundRemovalServiceProvider = Provider<BackgroundRemovalService>((
  ref,
) {
  return LocalRembgBackgroundRemovalService();
});

/// `null` means "All categories".
final categoryFilterProvider = StateProvider<ClothingCategory?>((ref) => null);

/// The live list of wardrobe items, sorted newest-first. UI reads this
/// provider; mutations go through its notifier's methods so every screen
/// stays in sync automatically.
final wardrobeItemsProvider =
    StateNotifierProvider<WardrobeItemsNotifier, List<ClothingItem>>((ref) {
      return WardrobeItemsNotifier(ref.watch(wardrobeRepositoryProvider));
    });

class WardrobeItemsNotifier extends StateNotifier<List<ClothingItem>> {
  WardrobeItemsNotifier(this._repository) : super(_repository.getAll());

  final WardrobeRepository _repository;

  Future<void> add(ClothingItem item) async {
    await _repository.add(item);
    state = _repository.getAll();
  }

  Future<void> delete(String id) async {
    await _repository.delete(id);
    state = _repository.getAll();
  }
}

/// The items matching the current [categoryFilterProvider] selection.
final filteredWardrobeItemsProvider = Provider((ref) {
  final items = ref.watch(wardrobeItemsProvider);
  final filter = ref.watch(categoryFilterProvider);
  if (filter == null) return items;
  return items.where((item) => item.category == filter).toList();
});
