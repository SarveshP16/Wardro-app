import 'package:flutter/material.dart';

import '../../../wardrobe/domain/clothing_item.dart';
import '../../domain/saved_outfit.dart';
import 'outfit_thumbnail_row.dart';

/// One previously-saved outfit, with a delete action.
class SavedOutfitCard extends StatelessWidget {
  const SavedOutfitCard({
    super.key,
    required this.outfit,
    required this.items,
    required this.onDelete,
  });

  final SavedOutfit outfit;
  final List<ClothingItem> items;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(outfit.title, style: theme.textTheme.titleMedium),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline),
                  tooltip: 'Remove',
                  onPressed: onDelete,
                ),
              ],
            ),
            const SizedBox(height: 8),
            OutfitThumbnailRow(items: items),
          ],
        ),
      ),
    );
  }
}
