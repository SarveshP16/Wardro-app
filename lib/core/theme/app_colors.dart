import 'package:flutter/material.dart';

/// Wardro's brand palette — an "editorial boutique" mood: warm ivory
/// neutrals, near-black ink for text, and a terracotta accent, with
/// sage/slate/ochre as secondary tones used to distinguish clothing
/// categories at a glance.
///
/// Keep every raw color value in this file. Screens and widgets should
/// reach for [Theme.of(context).colorScheme] or [AppColors.category]
/// rather than hardcoding hex values inline.
class AppColors {
  AppColors._();

  // Brand
  static const terracotta = Color(0xFFB2532D);
  static const terracottaLight = Color(0xFFD97B52);

  // Light theme neutrals
  static const ivory = Color(0xFFFAF6F0);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const outlineLight = Color(0xFFECE4D8);
  static const inkLight = Color(0xFF211D1A);

  // Dark theme neutrals
  static const charcoal = Color(0xFF1B1917);
  static const surfaceDark = Color(0xFF242220);
  static const outlineDark = Color(0xFF3A362F);
  static const inkDark = Color(0xFFF5EFE6);

  // Category accents (light)
  static const categoryTopLight = Color(0xFFB2532D); // terracotta
  static const categoryBottomLight = Color(0xFF4C5B72); // slate blue
  static const categoryOuterwearLight = Color(0xFFB8862B); // ochre
  static const categoryShoesLight = Color(0xFF5B6B4F); // sage

  // Category accents (dark, brightened for contrast on charcoal)
  static const categoryTopDark = Color(0xFFD97B52);
  static const categoryBottomDark = Color(0xFF7488A6);
  static const categoryOuterwearDark = Color(0xFFD4A63D);
  static const categoryShoesDark = Color(0xFF7C8F6C);
}
