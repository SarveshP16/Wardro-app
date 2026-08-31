import 'package:flutter/material.dart';

/// The occasion styles outfit generation supports at launch. Weather/season
/// awareness is planned as a later addition (see project memory) but is
/// intentionally not part of this enum yet.
enum OutfitStyle { casual, smartCasual, formal, evening }

extension OutfitStyleX on OutfitStyle {
  String get label => switch (this) {
    OutfitStyle.casual => 'Casual',
    OutfitStyle.smartCasual => 'Smart Casual',
    OutfitStyle.formal => 'Formal',
    OutfitStyle.evening => 'Evening',
  };

  IconData get icon => switch (this) {
    OutfitStyle.casual => Icons.weekend_outlined,
    OutfitStyle.smartCasual => Icons.style_outlined,
    OutfitStyle.formal => Icons.business_center_outlined,
    OutfitStyle.evening => Icons.nightlife_outlined,
  };

  /// Wire value expected by the `generate_outfit` Cloud Function — kept
  /// separate from [name] so reordering this enum can never silently
  /// change what's sent over the network.
  String get apiValue => switch (this) {
    OutfitStyle.casual => 'casual',
    OutfitStyle.smartCasual => 'smart_casual',
    OutfitStyle.formal => 'formal',
    OutfitStyle.evening => 'evening',
  };

  String get storageKey => apiValue;

  static OutfitStyle fromStorageKey(String key) {
    return OutfitStyle.values.firstWhere(
      (style) => style.storageKey == key,
      orElse: () => OutfitStyle.casual,
    );
  }
}
