import 'package:flutter/material.dart';

import '../../../../core/widgets/staggered_entrance.dart';
import '../../domain/clothing_item.dart';
import 'clothing_item_card.dart';

/// The scrollable grid of [ClothingItemCard]s, with each card's entrance
/// staggered by its position so the grid cascades in on first load and
/// whenever the category filter changes.
class WardrobeGrid extends StatelessWidget {
  const WardrobeGrid({
    super.key,
    required this.items,
    required this.onItemTap,
  });

  final List<ClothingItem> items;
  final ValueChanged<ClothingItem> onItemTap;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.82,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return ClothingItemCard(
          item: item,
          onTap: () => onItemTap(item),
        ).staggeredEntrance(index);
      },
    );
  }
}
