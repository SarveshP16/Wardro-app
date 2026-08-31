import 'package:hive/hive.dart';

import '../../../core/storage/hive_boxes.dart';

/// Reads/writes simple app-wide preferences — a plain key-value Hive box,
/// not per-record like the wardrobe/outfits boxes, since there's only a
/// handful of scalar settings.
class SettingsRepository {
  SettingsRepository(this._box);

  final Box _box;

  static const _themeModeKey = 'themeMode';

  /// Stored value: `'system'` | `'light'` | `'dark'`. `null` if unset.
  String? getThemeMode() => _box.get(_themeModeKey) as String?;

  Future<void> setThemeMode(String value) => _box.put(_themeModeKey, value);

  static SettingsRepository openDefault() {
    return SettingsRepository(Hive.box(HiveBoxes.settings));
  }
}
