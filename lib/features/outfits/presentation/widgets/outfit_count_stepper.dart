import 'package:flutter/material.dart';

/// "- N +" stepper for how many outfits Quick Match should generate.
class OutfitCountStepper extends StatelessWidget {
  const OutfitCountStepper({
    super.key,
    required this.count,
    required this.onChanged,
    required this.min,
    required this.max,
  });

  final int count;
  final ValueChanged<int> onChanged;
  final int min;
  final int max;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Text('Outfits to generate', style: theme.textTheme.bodyMedium),
        const Spacer(),
        DecoratedBox(
          decoration: BoxDecoration(
            border: Border.all(color: theme.colorScheme.outline),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.remove, size: 18),
                onPressed: count > min ? () => onChanged(count - 1) : null,
                visualDensity: VisualDensity.compact,
              ),
              SizedBox(
                width: 24,
                child: Text(
                  '$count',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleMedium,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add, size: 18),
                onPressed: count < max ? () => onChanged(count + 1) : null,
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
