import 'package:flutter/material.dart';

/// Chip row for picking System/Light/Dark — same visual language as the
/// category/style selectors elsewhere in the app.
class ThemeModeSelector extends StatelessWidget {
  const ThemeModeSelector({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final ThemeMode selected;
  final ValueChanged<ThemeMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    (String, IconData) labelAndIcon(ThemeMode mode) => switch (mode) {
      ThemeMode.system => ('System', Icons.brightness_auto_outlined),
      ThemeMode.light => ('Light', Icons.light_mode_outlined),
      ThemeMode.dark => ('Dark', Icons.dark_mode_outlined),
    };

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final mode in ThemeMode.values)
          ChoiceChip(
            label: Text(labelAndIcon(mode).$1),
            selected: selected == mode,
            onSelected: (_) => onChanged(mode),
            showCheckmark: false,
            avatar: Icon(
              labelAndIcon(mode).$2,
              size: 18,
              color: selected == mode ? colorScheme.primary : null,
            ),
            selectedColor: colorScheme.primary.withValues(alpha: 0.14),
            labelStyle: TextStyle(
              color: selected == mode ? colorScheme.primary : null,
              fontWeight: FontWeight.w700,
            ),
            side: BorderSide(
              color: selected == mode ? colorScheme.primary : colorScheme.outline,
            ),
          ),
      ],
    );
  }
}
