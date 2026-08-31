import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Shown while waiting on the outfit-generation Cloud Function call —
/// this one genuinely needs a network round-trip (unlike background
/// removal), so the copy sets that expectation.
class OutfitGeneratingView extends StatelessWidget {
  const OutfitGeneratingView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.auto_awesome_outlined,
            size: 48,
            color: theme.colorScheme.primary,
          ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(
            begin: const Offset(0.9, 0.9),
            end: const Offset(1.08, 1.08),
            duration: const Duration(milliseconds: 700),
          ),
          const SizedBox(height: 20),
          Text('Styling your outfits…', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Wardro is looking through your wardrobe.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.65),
            ),
          ),
        ],
      ),
    );
  }
}
