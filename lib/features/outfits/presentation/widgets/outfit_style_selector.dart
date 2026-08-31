import 'package:flutter/material.dart';

import '../../domain/outfit_style.dart';

/// Required (non-nullable) single-select row of occasion chips — the
/// generator always has exactly one style selected.
class OutfitStyleSelector extends StatelessWidget {
  const OutfitStyleSelector({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final OutfitStyle selected;
  final ValueChanged<OutfitStyle> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final style in OutfitStyle.values)
          ChoiceChip(
            label: Text(style.label),
            selected: selected == style,
            onSelected: (_) => onChanged(style),
            showCheckmark: false,
            avatar: Icon(
              style.icon,
              size: 18,
              color: selected == style ? colorScheme.primary : null,
            ),
            selectedColor: colorScheme.primary.withValues(alpha: 0.14),
            labelStyle: TextStyle(
              color: selected == style ? colorScheme.primary : null,
              fontWeight: FontWeight.w700,
            ),
            side: BorderSide(
              color: selected == style ? colorScheme.primary : colorScheme.outline,
            ),
          ),
      ],
    );
  }
}
