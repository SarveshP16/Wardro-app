import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../wardrobe/application/wardrobe_providers.dart';
import '../../wardrobe/domain/clothing_item.dart';
import '../data/outfit_repository.dart';
import '../domain/generated_outfit.dart';
import '../domain/outfit_style.dart';
import '../domain/saved_outfit.dart';
import '../services/color_match_outfit_generation_service.dart';
import '../services/outfit_generation_service.dart';

final outfitRepositoryProvider = Provider<OutfitRepository>((ref) {
  return OutfitRepository.openDefault();
});

/// Which engine powers generation: the free on-device color matcher, or
/// the paid Claude-vision "AI Stylist" (Cloud Function). See project
/// memory for why both exist.
enum OutfitGeneratorMode { quickMatch, aiStylist }

extension OutfitGeneratorModeX on OutfitGeneratorMode {
  String get label => switch (this) {
    OutfitGeneratorMode.quickMatch => 'Quick Match',
    OutfitGeneratorMode.aiStylist => 'AI Stylist',
  };
}

final outfitGeneratorModeProvider = StateProvider<OutfitGeneratorMode>(
  (ref) => OutfitGeneratorMode.quickMatch,
);

final outfitGenerationServiceProvider = Provider<OutfitGenerationService>((
  ref,
) {
  return switch (ref.watch(outfitGeneratorModeProvider)) {
    OutfitGeneratorMode.quickMatch => ColorMatchOutfitGenerationService(),
    OutfitGeneratorMode.aiStylist => HttpOutfitGenerationService(),
  };
});

/// The style currently selected in the generator UI.
final selectedOutfitStyleProvider = StateProvider<OutfitStyle>(
  (ref) => OutfitStyle.casual,
);

/// Resolves a wardrobe item id back to the full [ClothingItem], for
/// rendering a [GeneratedOutfit]/[SavedOutfit]'s thumbnails.
final wardrobeItemsByIdProvider = Provider<Map<String, ClothingItem>>((ref) {
  return {
    for (final item in ref.watch(wardrobeItemsProvider)) item.id: item,
  };
});

final savedOutfitsProvider =
    StateNotifierProvider<SavedOutfitsNotifier, List<SavedOutfit>>((ref) {
      return SavedOutfitsNotifier(ref.watch(outfitRepositoryProvider));
    });

class SavedOutfitsNotifier extends StateNotifier<List<SavedOutfit>> {
  SavedOutfitsNotifier(this._repository) : super(_repository.getAll());

  final OutfitRepository _repository;

  Future<void> save(OutfitStyle style, GeneratedOutfit outfit) async {
    final saved = SavedOutfit(
      id: const Uuid().v4(),
      style: style,
      title: outfit.title,
      rationale: outfit.rationale,
      itemIds: outfit.itemIds,
      createdAt: DateTime.now(),
    );
    await _repository.add(saved);
    state = _repository.getAll();
  }

  Future<void> delete(String id) async {
    await _repository.delete(id);
    state = _repository.getAll();
  }
}

/// State of the current (single, ephemeral) generation request.
sealed class OutfitGenerationState {
  const OutfitGenerationState();
}

class OutfitGenerationIdle extends OutfitGenerationState {
  const OutfitGenerationIdle();
}

class OutfitGenerationLoading extends OutfitGenerationState {
  const OutfitGenerationLoading();
}

class OutfitGenerationData extends OutfitGenerationState {
  const OutfitGenerationData(this.outfits);
  final List<GeneratedOutfit> outfits;
}

class OutfitGenerationError extends OutfitGenerationState {
  const OutfitGenerationError(this.message);
  final String message;
}

final outfitGenerationProvider =
    StateNotifierProvider.autoDispose<
      OutfitGenerationNotifier,
      OutfitGenerationState
    >((ref) {
      return OutfitGenerationNotifier(
        ref.watch(outfitGenerationServiceProvider),
      );
    });

class OutfitGenerationNotifier extends StateNotifier<OutfitGenerationState> {
  OutfitGenerationNotifier(this._service) : super(const OutfitGenerationIdle());

  final OutfitGenerationService _service;

  Future<void> generate(OutfitStyle style, List<ClothingItem> items) async {
    state = const OutfitGenerationLoading();
    try {
      final outfits = await _service.generate(style: style, items: items);
      state = OutfitGenerationData(outfits);
    } on OutfitGenerationException catch (e) {
      state = OutfitGenerationError(e.message);
    } catch (_) {
      state = const OutfitGenerationError('Something went wrong. Please try again.');
    }
  }

  void reset() => state = const OutfitGenerationIdle();
}
