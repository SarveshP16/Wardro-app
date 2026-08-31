import 'dart:io';

import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../wardrobe/domain/clothing_item.dart';

/// A row of small square item thumbnails for one outfit — shared by the
/// freshly-generated result card and the saved-outfit card so both stay
/// visually identical.
class OutfitThumbnailRow extends StatelessWidget {
  const OutfitThumbnailRow({super.key, required this.items});

  final List<ClothingItem> items;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final item = items[index];
          return Container(
            width: 88,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.photoBackdrop,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Image.file(File(item.imagePath), fit: BoxFit.contain),
          );
        },
      ),
    );
  }
}
