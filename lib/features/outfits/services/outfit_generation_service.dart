import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:http/http.dart' as http;

import '../../../core/config/app_config.dart';
import '../../wardrobe/domain/clothing_category.dart';
import '../../wardrobe/domain/clothing_item.dart';
import '../domain/generated_outfit.dart';
import '../domain/outfit_style.dart';

class OutfitGenerationException implements Exception {
  OutfitGenerationException(this.message);
  final String message;

  @override
  String toString() => message;
}

abstract class OutfitGenerationService {
  /// [count], [includeOuterwear], and [includeShoes] are Quick Match
  /// controls (see `ColorMatchOutfitGenerationService`) — the AI Stylist
  /// ignores them for now and always proposes its own best 2-4 piece
  /// combos (a future version could pass them into the prompt).
  Future<List<GeneratedOutfit>> generate({
    required OutfitStyle style,
    required List<ClothingItem> items,
    int count = 3,
    bool includeOuterwear = true,
    bool includeShoes = true,
  });
}

const _styleLabels = {
  OutfitStyle.casual: 'Casual',
  OutfitStyle.smartCasual: 'Smart Casual',
  OutfitStyle.formal: 'Formal',
  OutfitStyle.evening: 'Evening',
};

const _outfitCount = 3;
const _model = 'claude-opus-5';
const _anthropicVersion = '2023-06-01';

const _outfitsSchema = {
  'type': 'object',
  'properties': {
    'outfits': {
      'type': 'array',
      'items': {
        'type': 'object',
        'properties': {
          'title': {'type': 'string'},
          'rationale': {'type': 'string'},
          'itemIds': {
            'type': 'array',
            'items': {'type': 'string'},
          },
        },
        'required': ['title', 'rationale', 'itemIds'],
        'additionalProperties': false,
      },
    },
  },
  'required': ['outfits'],
  'additionalProperties': false,
};

/// Calls the Anthropic Messages API directly with [AppConfig.anthropicApiKey].
/// This app is for personal/self-hosted use only — it's never distributed
/// via an app store — so there's no untrusted audience the key needs to be
/// hidden from, and no backend proxy is needed. Each wardrobe item's cutout
/// is downscaled before being sent — a raw camera-resolution PNG per item
/// would needlessly bloat both the request payload and Claude's per-image
/// token cost, since the model doesn't benefit from more detail than it
/// takes to tell a garment's color/pattern/silhouette apart.
class HttpOutfitGenerationService implements OutfitGenerationService {
  static const _maxDimension = 512;

  @override
  Future<List<GeneratedOutfit>> generate({
    required OutfitStyle style,
    required List<ClothingItem> items,
    int count = 3,
    bool includeOuterwear = true,
    bool includeShoes = true,
  }) async {
    if (AppConfig.anthropicApiKey.isEmpty) {
      throw OutfitGenerationException(
        'AI Stylist isn\'t configured yet (missing ANTHROPIC_API_KEY build '
        'define — see dart_define.example.json).',
      );
    }
    if (items.isEmpty) {
      throw OutfitGenerationException('Add some wardrobe items first.');
    }

    final styleLabel = _styleLabels[style]!;
    final validIds = items.map((item) => item.id).toSet();

    final content = <Map<String, dynamic>>[
      {
        'type': 'text',
        'text':
            "You are a fashion stylist choosing outfits from a user's own "
            "wardrobe for a '$styleLabel' occasion. Each image below is one "
            'wardrobe item; its id and category are given right before it. '
            'Only ever use the item ids provided -- never invent one.',
      },
    ];
    for (final item in items) {
      final resized = await _resizeForApi(
        await File(item.imagePath).readAsBytes(),
      );
      content.add({
        'type': 'text',
        'text': 'item id: ${item.id} | category: ${item.category.storageKey}',
      });
      content.add({
        'type': 'image',
        'source': {
          'type': 'base64',
          'media_type': 'image/png',
          'data': base64Encode(resized),
        },
      });
    }
    content.add({
      'type': 'text',
      'text':
          'Propose exactly $_outfitCount distinct outfit combinations '
          'suited to a $styleLabel occasion, each using 2-4 of the items '
          'above (mix categories sensibly: a top, a bottom, and optionally '
          'outerwear and/or shoes). Favor combinations that genuinely look '
          'good together -- color and pattern harmony, and appropriateness '
          'for the occasion.',
    });

    http.Response response;
    try {
      response = await http
          .post(
            Uri.parse('https://api.anthropic.com/v1/messages'),
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': AppConfig.anthropicApiKey,
              'anthropic-version': _anthropicVersion,
            },
            body: jsonEncode({
              'model': _model,
              'max_tokens': 4096,
              'messages': [
                {'role': 'user', 'content': content},
              ],
              'output_config': {
                'format': {'type': 'json_schema', 'schema': _outfitsSchema},
              },
            }),
          )
          .timeout(const Duration(seconds: 60));
    } catch (_) {
      throw OutfitGenerationException(
        'Could not reach Claude. Check your connection and try again.',
      );
    }

    if (response.statusCode != 200) {
      String message = 'Outfit generation failed (${response.statusCode}).';
      try {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        final error = body['error'] as Map<String, dynamic>?;
        if (error?['message'] is String) message = error!['message'] as String;
      } catch (_) {
        // Keep the generic message above.
      }
      throw OutfitGenerationException(message);
    }

    final outfits = _parseOutfits(response.body, validIds);
    if (outfits.isEmpty) {
      throw OutfitGenerationException(
        'Could not put together an outfit from these items. Try a different style.',
      );
    }
    return outfits;
  }

  List<GeneratedOutfit> _parseOutfits(String responseBody, Set<String> validIds) {
    final body = jsonDecode(responseBody) as Map<String, dynamic>;

    if (body['stop_reason'] == 'refusal') {
      throw OutfitGenerationException(
        'Claude declined to generate outfits for this request.',
      );
    }

    final blocks = (body['content'] as List<dynamic>? ?? const []);
    final text = blocks
        .cast<Map<String, dynamic>>()
        .firstWhere(
          (block) => block['type'] == 'text',
          orElse: () => const {},
        )['text'] as String?;
    if (text == null) {
      throw OutfitGenerationException(
        'Claude did not return a structured outfit proposal.',
      );
    }

    final parsed = jsonDecode(text) as Map<String, dynamic>;
    final rawOutfits = (parsed['outfits'] as List<dynamic>? ?? const []);

    // Defensive: drop any hallucinated item id and any outfit left empty by that.
    final cleaned = <GeneratedOutfit>[];
    for (final raw in rawOutfits) {
      final outfit = raw as Map<String, dynamic>;
      final itemIds = (outfit['itemIds'] as List<dynamic>? ?? const [])
          .cast<String>()
          .where(validIds.contains)
          .toList();
      if (itemIds.isNotEmpty) {
        cleaned.add(
          GeneratedOutfit(
            title: outfit['title'] as String? ?? 'Outfit',
            rationale: outfit['rationale'] as String? ?? '',
            itemIds: itemIds,
          ),
        );
      }
    }
    return cleaned;
  }

  Future<Uint8List> _resizeForApi(Uint8List bytes) async {
    final codec = await ui.instantiateImageCodec(
      bytes,
      targetWidth: _maxDimension,
    );
    final frame = await codec.getNextFrame();
    final byteData = await frame.image.toByteData(
      format: ui.ImageByteFormat.png,
    );
    return byteData!.buffer.asUint8List();
  }
}
