import 'dart:convert';

import 'package:flutter/painting.dart' show Color;
import 'package:flutter/services.dart' show rootBundle;

/// One reference color from Sanzo Wada's *A Dictionary of Colour
/// Combinations* (159 colors spanning 348 published palettes) — see
/// `assets/data/sanzo_wada_colors.LICENSE.md` for the dataset's source
/// and license.
class _Entry {
  const _Entry({
    required this.name,
    required this.r,
    required this.g,
    required this.b,
    required this.combinations,
  });

  final String name;
  final int r, g, b;

  /// Which of Wada's 348 palette plates this color appears in.
  final Set<int> combinations;
}

/// Looks up whether two colors correspond to a pairing Sanzo Wada
/// actually published together, by snapping each to its nearest of his
/// 159 reference colors (plain RGB distance — not perceptually exact,
/// but adequate for a "does this look like a real pairing" check) and
/// checking whether those two reference colors share a palette.
///
/// This supplements (never fully replaces) [ColorHarmony]'s geometric
/// hue-distance scoring — a real, curated color reference plus a
/// synthetic fallback for combinations Wada never happened to publish.
class SanzoWadaPalette {
  SanzoWadaPalette._();
  static final SanzoWadaPalette instance = SanzoWadaPalette._();

  static const _assetPath = 'assets/data/sanzo_wada_colors.json';

  List<_Entry>? _entries;
  Future<void>? _loading;
  final Map<Color, _Entry> _nearestCache = {};

  /// Loads and parses the dataset once; safe to call repeatedly (including
  /// concurrently) — subsequent calls await the same in-flight load or
  /// return immediately once loaded.
  Future<void> ensureLoaded() {
    if (_entries != null) return Future.value();
    return _loading ??= _load();
  }

  Future<void> _load() async {
    final raw = await rootBundle.loadString(_assetPath);
    final list = jsonDecode(raw) as List<dynamic>;
    _entries = [
      for (final item in list.cast<Map<String, dynamic>>())
        _Entry(
          name: item['name'] as String,
          r: (item['rgb'] as List<dynamic>)[0] as int,
          g: (item['rgb'] as List<dynamic>)[1] as int,
          b: (item['rgb'] as List<dynamic>)[2] as int,
          combinations: (item['combinations'] as List<dynamic>)
              .map((id) => id as int)
              .toSet(),
        ),
    ];
  }

  /// True if [a] and [b]'s nearest reference colors were published
  /// together in at least one of Wada's palettes (or are the same
  /// reference color). Call [ensureLoaded] first — throws otherwise.
  bool isPaired(Color a, Color b) {
    final entryA = _nearest(a);
    final entryB = _nearest(b);
    if (identical(entryA, entryB)) return true;
    return entryA.combinations.any(entryB.combinations.contains);
  }

  /// The evocative name Wada gave the reference color nearest to [color]
  /// (e.g. "Hermosa Pink") — used to flavor a Quick Match outfit's
  /// rationale text.
  String nearestName(Color color) => _nearest(color).name;

  _Entry _nearest(Color color) {
    final entries = _entries;
    if (entries == null || entries.isEmpty) {
      throw StateError(
        'SanzoWadaPalette.ensureLoaded() must complete before use.',
      );
    }
    final cached = _nearestCache[color];
    if (cached != null) return cached;

    final argb = color.toARGB32();
    final r = (argb >> 16) & 0xFF;
    final g = (argb >> 8) & 0xFF;
    final b = argb & 0xFF;

    var best = entries.first;
    var bestDistance = _distanceSquared(r, g, b, best);
    for (final entry in entries.skip(1)) {
      final distance = _distanceSquared(r, g, b, entry);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = entry;
      }
    }
    _nearestCache[color] = best;
    return best;
  }

  static int _distanceSquared(int r, int g, int b, _Entry entry) {
    final dr = r - entry.r;
    final dg = g - entry.g;
    final db = b - entry.b;
    return dr * dr + dg * dg + db * db;
  }
}
