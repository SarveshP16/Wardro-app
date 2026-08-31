import 'package:flutter/painting.dart' show Color;

import 'clothing_category.dart';

/// One saved wardrobe item: a background-removed cutout image plus the
/// metadata the user (or, later, AI) needs to reason about it.
///
/// Stored in Hive as a plain `Map<String, dynamic>` via [toMap]/[fromMap]
/// rather than a generated [TypeAdapter] — the shape is simple enough that
/// hand-written (de)serialization stays easy to read and avoids a
/// build_runner step for this feature.
class ClothingItem {
  const ClothingItem({
    required this.id,
    required this.category,
    required this.imagePath,
    required this.createdAt,
    this.name,
    this.dominantColor,
  });

  final String id;
  final ClothingCategory category;

  /// Absolute path to the background-removed cutout PNG on disk.
  final String imagePath;
  final DateTime createdAt;

  /// Optional user-given label, e.g. "Blue denim jacket".
  final String? name;

  /// Average color of the cutout's opaque pixels, computed once at add-time
  /// (see `DominantColorExtractor`) and cached here so the on-device color-
  /// match outfit generator never has to re-decode the image. `null` only
  /// for items saved before this field existed.
  final Color? dominantColor;

  ClothingItem copyWith({
    String? id,
    ClothingCategory? category,
    String? imagePath,
    DateTime? createdAt,
    String? name,
    Color? dominantColor,
  }) {
    return ClothingItem(
      id: id ?? this.id,
      category: category ?? this.category,
      imagePath: imagePath ?? this.imagePath,
      createdAt: createdAt ?? this.createdAt,
      name: name ?? this.name,
      dominantColor: dominantColor ?? this.dominantColor,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'category': category.storageKey,
      'imagePath': imagePath,
      'createdAt': createdAt.toIso8601String(),
      'name': name,
      'dominantColor': dominantColor?.toARGB32(),
    };
  }

  factory ClothingItem.fromMap(Map<dynamic, dynamic> map) {
    final colorValue = map['dominantColor'] as int?;
    return ClothingItem(
      id: map['id'] as String,
      category: ClothingCategoryX.fromStorageKey(map['category'] as String),
      imagePath: map['imagePath'] as String,
      createdAt: DateTime.parse(map['createdAt'] as String),
      name: map['name'] as String?,
      dominantColor: colorValue == null ? null : Color(colorValue),
    );
  }
}
