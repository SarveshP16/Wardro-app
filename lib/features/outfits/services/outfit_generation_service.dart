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
  /// combos server-side (a future version could pass them into the
  /// prompt).
  Future<List<GeneratedOutfit>> generate({
    required OutfitStyle style,
    required List<ClothingItem> items,
    int count = 3,
    bool includeOuterwear = true,
    bool includeShoes = true,
  });
}

/// Calls the `generate_outfit` Cloud Function (see `functions/main.py`),
/// which holds the Anthropic key server-side. Each wardrobe item's cutout
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
    if (AppConfig.outfitFunctionUrl.isEmpty) {
      throw OutfitGenerationException(
        'Outfit generation isn\'t configured yet (missing OUTFIT_FUNCTION_URL '
        'build define).',
      );
    }

    final payloadItems = await Future.wait(
      items.map((item) async {
        final resized = await _resizeForApi(
          await File(item.imagePath).readAsBytes(),
        );
        return {
          'id': item.id,
          'category': item.category.storageKey,
          'imageBase64': base64Encode(resized),
        };
      }),
    );

    http.Response response;
    try {
      response = await http
          .post(
            Uri.parse(AppConfig.outfitFunctionUrl),
            headers: {
              'Content-Type': 'application/json',
              'X-Wardro-App-Key': AppConfig.appSharedSecret,
            },
            body: jsonEncode({
              'style': style.apiValue,
              'items': payloadItems,
            }),
          )
          .timeout(const Duration(seconds: 60));
    } catch (_) {
      throw OutfitGenerationException(
        'Could not reach the outfit generator. Check your connection and try again.',
      );
    }

    if (response.statusCode != 200) {
      String message = 'Outfit generation failed (${response.statusCode}).';
      try {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        if (body['error'] is String) message = body['error'] as String;
      } catch (_) {
        // Keep the generic message above.
      }
      throw OutfitGenerationException(message);
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final outfits = (body['outfits'] as List<dynamic>? ?? const [])
        .map((json) => GeneratedOutfit.fromJson(json as Map<String, dynamic>))
        .toList();

    if (outfits.isEmpty) {
      throw OutfitGenerationException(
        'Could not put together an outfit from these items. Try a different style.',
      );
    }
    return outfits;
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
