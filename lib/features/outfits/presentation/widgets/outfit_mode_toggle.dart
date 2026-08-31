import 'package:flutter/material.dart';

import '../../application/outfit_providers.dart';

/// Segmented toggle between the free on-device "Quick Match" generator and
/// the paid "AI Stylist". AI Stylist is shown but disabled until its
/// Cloud Function backend is actually deployed (see project memory) --
/// visible now so the upsell exists, without pretending it works yet.
class OutfitModeToggle extends StatelessWidget {
  const OutfitModeToggle({
    super.key,
    required this.mode,
    required this.onChanged,
    this.aiStylistEnabled = false,
  });

  final OutfitGeneratorMode mode;
  final ValueChanged<OutfitGeneratorMode> onChanged;
  final bool aiStylistEnabled;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Row(
          children: [
            Expanded(
              child: _Segment(
                label: 'Quick Match',
                icon: Icons.palette_outlined,
                selected: mode == OutfitGeneratorMode.quickMatch,
                onTap: () => onChanged(OutfitGeneratorMode.quickMatch),
              ),
            ),
            Expanded(
              child: _Segment(
                label: 'AI Stylist',
                icon: Icons.auto_awesome,
                selected: mode == OutfitGeneratorMode.aiStylist,
                onTap: aiStylistEnabled
                    ? () => onChanged(OutfitGeneratorMode.aiStylist)
                    : null,
                badge: aiStylistEnabled ? null : 'Soon',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Segment extends StatelessWidget {
  const _Segment({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
    this.badge,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback? onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final disabled = onTap == null;
    final foreground = disabled
        ? theme.colorScheme.onSurface.withValues(alpha: 0.38)
        : (selected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface);

    return Material(
      color: selected && !disabled ? theme.colorScheme.primary : Colors.transparent,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: foreground),
              const SizedBox(height: 4),
              Text(
                label,
                style: theme.textTheme.labelMedium?.copyWith(color: foreground),
              ),
              if (badge != null)
                Text(
                  badge!,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: foreground,
                    fontSize: 10,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
