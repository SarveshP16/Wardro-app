import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Shown while the on-device model removes the background from the
/// just-captured photo. This can take a moment on older devices, so it
/// gets its own reassuring state rather than a bare spinner.
class AddItemProcessingView extends StatelessWidget {
  const AddItemProcessingView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.auto_fix_high_outlined,
            size: 48,
            color: theme.colorScheme.primary,
          ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(
            begin: const Offset(0.9, 0.9),
            end: const Offset(1.05, 1.05),
            duration: const Duration(milliseconds: 700),
          ),
          const SizedBox(height: 20),
          Text('Removing the background…', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Running on your device — no photo leaves your phone.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.65),
            ),
          ),
        ],
      ),
    );
  }
}
