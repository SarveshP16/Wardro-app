import 'dart:io';

import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../domain/clothing_category.dart';
import '../../domain/clothing_item.dart';

/// One tile in the wardrobe grid: the cutout image on a soft neutral
/// backdrop (cutouts are transparent-background PNGs, so they need a
/// surface behind them to read as a "product photo") plus a small
/// category-colored badge in the corner.
class ClothingItemCard extends StatelessWidget {
  const ClothingItemCard({super.key, required this.item, required this.onTap});

  final ClothingItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final accent = item.category.color(brightness);

    return Card(
      child: InkWell(
        onTap: onTap,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Container(
              color: AppColors.photoBackdrop,
              padding: const EdgeInsets.all(14),
              child: Hero(
                tag: 'wardrobe-item-${item.id}',
                child: Image.file(File(item.imagePath), fit: BoxFit.contain),
              ),
            ),
            Positioned(
              left: 10,
              top: 10,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: accent,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: accent.withValues(alpha: 0.4),
                      blurRadius: 6,
                    ),
                  ],
                ),
                child: Icon(item.category.icon, size: 14, color: Colors.white),
              ),
            ),
            if (item.name != null)
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.55),
                        Colors.black.withValues(alpha: 0),
                      ],
                    ),
                  ),
                  child: Text(
                    item.name!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
