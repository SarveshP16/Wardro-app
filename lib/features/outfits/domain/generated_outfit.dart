/// One outfit combination proposed by a single generation call. Ephemeral —
/// not persisted unless the user saves it (see [SavedOutfit]).
class GeneratedOutfit {
  const GeneratedOutfit({
    required this.title,
    required this.rationale,
    required this.itemIds,
  });

  final String title;
  final String rationale;
  final List<String> itemIds;

  factory GeneratedOutfit.fromJson(Map<String, dynamic> json) {
    return GeneratedOutfit(
      title: json['title'] as String? ?? 'Outfit',
      rationale: json['rationale'] as String? ?? '',
      itemIds: (json['itemIds'] as List<dynamic>? ?? const [])
          .map((id) => id as String)
          .toList(),
    );
  }
}
