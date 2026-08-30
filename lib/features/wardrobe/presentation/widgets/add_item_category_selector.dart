import 'package:flutter/material.dart';

import '../../domain/clothing_category.dart';

/// Required (non-nullable) category picker used in the add-item form —
/// distinct from [CategoryFilterBar], which allows an "All" state for
/// browsing.
class AddItemCategorySelector extends StatelessWidget {
  const AddItemCategorySelector({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final ClothingCategory selected;
  final ValueChanged<ClothingCategory> onChanged;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final category in ClothingCategory.values)
          ChoiceChip(
            label: Text(category.label),
            selected: selected == category,
            onSelected: (_) => onChanged(category),
            showCheckmark: false,
            avatar: CircleAvatar(
              backgroundColor: category.color(brightness),
              radius: 6,
            ),
            selectedColor: category.color(brightness).withValues(alpha: 0.16),
            labelStyle: TextStyle(
              color: selected == category ? category.color(brightness) : null,
              fontWeight: FontWeight.w700,
            ),
            side: BorderSide(
              color: selected == category
                  ? category.color(brightness)
                  : Theme.of(context).colorScheme.outline,
            ),
          ),
      ],
    );
  }
}
