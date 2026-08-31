import 'package:flutter/material.dart';

import '../../../wardrobe/domain/clothing_category.dart';

/// Lets the user include/exclude outerwear and shoes from Quick Match
/// combinations. A category's chip only shows up if the wardrobe actually
/// has items in it — no point offering to toggle an empty category.
class OutfitCategoryToggles extends StatelessWidget {
  const OutfitCategoryToggles({
    super.key,
    required this.hasOuterwear,
    required this.hasShoes,
    required this.includeOuterwear,
    required this.includeShoes,
    required this.onOuterwearChanged,
    required this.onShoesChanged,
  });

  final bool hasOuterwear;
  final bool hasShoes;
  final bool includeOuterwear;
  final bool includeShoes;
  final ValueChanged<bool> onOuterwearChanged;
  final ValueChanged<bool> onShoesChanged;

  @override
  Widget build(BuildContext context) {
    if (!hasOuterwear && !hasShoes) return const SizedBox.shrink();
    final brightness = Theme.of(context).brightness;

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (hasOuterwear)
          FilterChip(
            label: const Text('Outerwear'),
            selected: includeOuterwear,
            onSelected: onOuterwearChanged,
            avatar: Icon(
              ClothingCategory.outerwear.icon,
              size: 18,
              color: includeOuterwear
                  ? ClothingCategory.outerwear.color(brightness)
                  : null,
            ),
          ),
        if (hasShoes)
          FilterChip(
            label: const Text('Shoes'),
            selected: includeShoes,
            onSelected: onShoesChanged,
            avatar: Icon(
              ClothingCategory.shoes.icon,
              size: 18,
              color: includeShoes
                  ? ClothingCategory.shoes.color(brightness)
                  : null,
            ),
          ),
      ],
    );
  }
}
