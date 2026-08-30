import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/wardrobe_providers.dart';
import '../../domain/clothing_category.dart';

/// Horizontal row of filter chips: "All" plus one per [ClothingCategory],
/// each tinted with that category's accent color so the active filter is
/// legible at a glance, not just via the selected/unselected chip style.
class CategoryFilterBar extends ConsumerWidget {
  const CategoryFilterBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(categoryFilterProvider);
    final brightness = Theme.of(context).brightness;

    Widget chip({
      required String label,
      required bool isSelected,
      required Color accent,
      required VoidCallback onTap,
    }) {
      return Padding(
        padding: const EdgeInsets.only(right: 8),
        child: ChoiceChip(
          label: Text(label),
          selected: isSelected,
          onSelected: (_) => onTap(),
          showCheckmark: false,
          avatar: CircleAvatar(backgroundColor: accent, radius: 6),
          selectedColor: accent.withValues(alpha: 0.16),
          labelStyle: TextStyle(
            color: isSelected ? accent : null,
            fontWeight: FontWeight.w700,
          ),
          side: BorderSide(color: isSelected ? accent : Theme.of(context).colorScheme.outline),
        ),
      );
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          chip(
            label: 'All',
            isSelected: selected == null,
            accent: Theme.of(context).colorScheme.primary,
            onTap: () => ref.read(categoryFilterProvider.notifier).state = null,
          ),
          for (final category in ClothingCategory.values)
            chip(
              label: category.label,
              isSelected: selected == category,
              accent: category.color(brightness),
              onTap: () =>
                  ref.read(categoryFilterProvider.notifier).state = category,
            ),
        ],
      ),
    );
  }
}
