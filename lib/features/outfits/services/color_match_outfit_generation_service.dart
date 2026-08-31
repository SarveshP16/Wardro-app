import 'dart:math';

import 'package:flutter/painting.dart' show Color;

import '../../wardrobe/domain/clothing_category.dart';
import '../../wardrobe/domain/clothing_item.dart';
import '../domain/color_harmony.dart';
import '../domain/generated_outfit.dart';
import '../domain/outfit_style.dart';
import '../domain/sanzo_wada_palette.dart';
import 'outfit_generation_service.dart';

const _fallbackNeutral = Color(0xFF9E9E9E);

/// Free, fully offline outfit generation: ranks top+bottom(+outerwear)
/// (+shoes) combinations from the user's own wardrobe purely by color
/// harmony (see [ColorHarmony], boosted by real curated pairings from
/// [SanzoWadaPalette]) -- no network call, no occasion awareness (that's
/// what the paid AI Stylist adds). [style] is accepted only to satisfy
/// [OutfitGenerationService]'s shared interface; Quick Match ignores it,
/// by design (see project memory).
class ColorMatchOutfitGenerationService implements OutfitGenerationService {
  static const _maxCombosEvaluated = 2000;
  static const maxResultCount = 8;

  @override
  Future<List<GeneratedOutfit>> generate({
    required OutfitStyle style,
    required List<ClothingItem> items,
    int count = 3,
    bool includeOuterwear = true,
    bool includeShoes = true,
  }) async {
    await SanzoWadaPalette.instance.ensureLoaded();

    final tops = items.where((i) => i.category == ClothingCategory.top).toList();
    final bottoms = items
        .where((i) => i.category == ClothingCategory.bottom)
        .toList();
    final outerwear = includeOuterwear
        ? items.where((i) => i.category == ClothingCategory.outerwear).toList()
        : const <ClothingItem>[];
    final shoes = includeShoes
        ? items.where((i) => i.category == ClothingCategory.shoes).toList()
        : const <ClothingItem>[];

    if (tops.isEmpty || bottoms.isEmpty) {
      throw OutfitGenerationException(
        'Add at least one top and one bottom to use Quick Match.',
      );
    }

    final outerwearOptions = <ClothingItem?>[null, ...outerwear];
    final shoeOptions = <ClothingItem?>[null, ...shoes];
    final totalCombos =
        tops.length * bottoms.length * outerwearOptions.length * shoeOptions.length;

    final combos = <_ScoredCombo>[];
    if (totalCombos <= _maxCombosEvaluated) {
      for (final top in tops) {
        for (final bottom in bottoms) {
          for (final outer in outerwearOptions) {
            for (final shoe in shoeOptions) {
              combos.add(_score(top, bottom, outer, shoe));
            }
          }
        }
      }
    } else {
      // Wardrobe is large enough that full enumeration isn't worth it --
      // random-sample the combination space instead of scoring all of it.
      final random = Random();
      for (var i = 0; i < _maxCombosEvaluated; i++) {
        combos.add(
          _score(
            tops[random.nextInt(tops.length)],
            bottoms[random.nextInt(bottoms.length)],
            outerwearOptions[random.nextInt(outerwearOptions.length)],
            shoeOptions[random.nextInt(shoeOptions.length)],
          ),
        );
      }
    }

    combos.sort((a, b) => b.score.compareTo(a.score));

    final resultCount = count.clamp(1, maxResultCount);
    final results = <GeneratedOutfit>[];
    final seenSignatures = <String>{};
    for (final combo in combos) {
      final signature = combo.items.map((i) => i.id).join(',');
      if (!seenSignatures.add(signature)) continue;
      results.add(combo.toGeneratedOutfit());
      if (results.length == resultCount) break;
    }

    if (results.isEmpty) {
      throw OutfitGenerationException(
        'Could not put together an outfit from these items.',
      );
    }
    return results;
  }

  _ScoredCombo _score(
    ClothingItem top,
    ClothingItem bottom,
    ClothingItem? outer,
    ClothingItem? shoe,
  ) {
    final palette = SanzoWadaPalette.instance;
    final items = [top, bottom, ?outer, ?shoe];
    final colors = [
      for (final item in items) item.dominantColor ?? _fallbackNeutral,
    ];

    var total = 0.0;
    var pairs = 0;
    for (var i = 0; i < colors.length; i++) {
      for (var j = i + 1; j < colors.length; j++) {
        total += ColorHarmony.hybridScore(colors[i], colors[j], palette);
        pairs++;
      }
    }
    final score = pairs == 0 ? 0.0 : total / pairs;

    final title = ColorHarmony.describe(
      top.dominantColor ?? _fallbackNeutral,
      bottom.dominantColor ?? _fallbackNeutral,
      palette: palette,
    );
    final pieces = [
      top.category.label,
      bottom.category.label,
      if (outer != null) outer.category.label,
      if (shoe != null) shoe.category.label,
    ].join(' + ');

    return _ScoredCombo(
      items: items,
      score: score,
      title: title,
      rationale: 'Quick Match paired these by color: $pieces.',
    );
  }
}

class _ScoredCombo {
  _ScoredCombo({
    required this.items,
    required this.score,
    required this.title,
    required this.rationale,
  });

  final List<ClothingItem> items;
  final double score;
  final String title;
  final String rationale;

  GeneratedOutfit toGeneratedOutfit() {
    return GeneratedOutfit(
      title: title,
      rationale: rationale,
      itemIds: items.map((i) => i.id).toList(),
    );
  }
}
