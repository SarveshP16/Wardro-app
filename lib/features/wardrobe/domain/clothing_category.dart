import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// The four wardrobe categories supported at launch. Kept as a plain enum
/// (rather than free-text) so filtering, storage, and outfit-matching
/// logic can all switch on a closed set of values.
enum ClothingCategory { top, bottom, outerwear, shoes }

extension ClothingCategoryX on ClothingCategory {
  String get label => switch (this) {
    ClothingCategory.top => 'Top',
    ClothingCategory.bottom => 'Bottom',
    ClothingCategory.outerwear => 'Outerwear',
    ClothingCategory.shoes => 'Shoes',
  };

  IconData get icon => switch (this) {
    ClothingCategory.top => Icons.checkroom,
    ClothingCategory.bottom => Icons.dry_cleaning_outlined,
    ClothingCategory.outerwear => Icons.ac_unit_outlined,
    ClothingCategory.shoes => Icons.hiking_outlined,
  };

  /// Category accent color, adapted for the current [Brightness].
  Color color(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    return switch (this) {
      ClothingCategory.top =>
        isDark ? AppColors.categoryTopDark : AppColors.categoryTopLight,
      ClothingCategory.bottom =>
        isDark ? AppColors.categoryBottomDark : AppColors.categoryBottomLight,
      ClothingCategory.outerwear => isDark
          ? AppColors.categoryOuterwearDark
          : AppColors.categoryOuterwearLight,
      ClothingCategory.shoes =>
        isDark ? AppColors.categoryShoesDark : AppColors.categoryShoesLight,
    };
  }

  /// Stable string key used for persistence — intentionally decoupled
  /// from [name] so reordering the enum can never silently corrupt data
  /// already saved to disk.
  String get storageKey => switch (this) {
    ClothingCategory.top => 'top',
    ClothingCategory.bottom => 'bottom',
    ClothingCategory.outerwear => 'outerwear',
    ClothingCategory.shoes => 'shoes',
  };

  static ClothingCategory fromStorageKey(String key) {
    return ClothingCategory.values.firstWhere(
      (category) => category.storageKey == key,
      orElse: () => ClothingCategory.top,
    );
  }
}
