import 'outfit_style.dart';

/// A [GeneratedOutfit] the user chose to keep. Stored in Hive the same way
/// as [ClothingItem] — a plain `Map`, hand-written (de)serialization, no
/// generated `TypeAdapter`.
class SavedOutfit {
  const SavedOutfit({
    required this.id,
    required this.style,
    required this.title,
    required this.rationale,
    required this.itemIds,
    required this.createdAt,
  });

  final String id;
  final OutfitStyle style;
  final String title;
  final String rationale;
  final List<String> itemIds;
  final DateTime createdAt;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'style': style.storageKey,
      'title': title,
      'rationale': rationale,
      'itemIds': itemIds,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory SavedOutfit.fromMap(Map<dynamic, dynamic> map) {
    return SavedOutfit(
      id: map['id'] as String,
      style: OutfitStyleX.fromStorageKey(map['style'] as String),
      title: map['title'] as String,
      rationale: map['rationale'] as String? ?? '',
      itemIds: (map['itemIds'] as List<dynamic>)
          .map((id) => id as String)
          .toList(),
      createdAt: DateTime.parse(map['createdAt'] as String),
    );
  }
}
