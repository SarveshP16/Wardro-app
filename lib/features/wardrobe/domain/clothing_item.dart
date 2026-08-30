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
  });

  final String id;
  final ClothingCategory category;

  /// Absolute path to the background-removed cutout PNG on disk.
  final String imagePath;
  final DateTime createdAt;

  /// Optional user-given label, e.g. "Blue denim jacket".
  final String? name;

  ClothingItem copyWith({
    String? id,
    ClothingCategory? category,
    String? imagePath,
    DateTime? createdAt,
    String? name,
  }) {
    return ClothingItem(
      id: id ?? this.id,
      category: category ?? this.category,
      imagePath: imagePath ?? this.imagePath,
      createdAt: createdAt ?? this.createdAt,
      name: name ?? this.name,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'category': category.storageKey,
      'imagePath': imagePath,
      'createdAt': createdAt.toIso8601String(),
      'name': name,
    };
  }

  factory ClothingItem.fromMap(Map<dynamic, dynamic> map) {
    return ClothingItem(
      id: map['id'] as String,
      category: ClothingCategoryX.fromStorageKey(map['category'] as String),
      imagePath: map['imagePath'] as String,
      createdAt: DateTime.parse(map['createdAt'] as String),
      name: map['name'] as String?,
    );
  }
}
