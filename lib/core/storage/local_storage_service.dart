import 'package:hive_flutter/hive_flutter.dart';

import 'hive_boxes.dart';

/// Boots Hive and opens every box the app needs, once, before [runApp].
/// Wardro is local-first for the MVP (see project memory) — there is no
/// backend to fall back to, so this must succeed before anything else runs.
class LocalStorageService {
  LocalStorageService._();

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox<Map>(HiveBoxes.wardrobeItems);
    await Hive.openBox<Map>(HiveBoxes.savedOutfits);
    await Hive.openBox(HiveBoxes.settings);
  }
}
