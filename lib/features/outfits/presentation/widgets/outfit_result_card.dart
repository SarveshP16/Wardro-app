import 'package:flutter/material.dart';

import '../../../wardrobe/domain/clothing_item.dart';
import '../../domain/generated_outfit.dart';
import 'outfit_thumbnail_row.dart';

/// One freshly-generated outfit suggestion, with a save action.
class OutfitResultCard extends StatelessWidget {
  const OutfitResultCard({
    super.key,
    required this.outfit,
    required this.items,
    required this.isSaved,
    required this.onSave,
  });

  final GeneratedOutfit outfit;
  final List<ClothingItem> items;
  final bool isSaved;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(outfit.title, style: theme.textTheme.titleMedium),
            if (outfit.rationale.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                outfit.rationale,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.textTheme.bodyMedium?.color?.withValues(
                    alpha: 0.7,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 14),
            OutfitThumbnailRow(items: items),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: isSaved ? null : onSave,
                icon: Icon(
                  isSaved ? Icons.bookmark : Icons.bookmark_outline,
                ),
                label: Text(isSaved ? 'Saved' : 'Save'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
