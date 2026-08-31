import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../data/settings_repository.dart';

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  return SettingsRepository.openDefault();
});

/// The app's theme mode — persisted, so the choice survives a restart.
/// Read by `WardroApp` (`app.dart`) and written by `SettingsScreen`.
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((
  ref,
) {
  return ThemeModeNotifier(ref.watch(settingsRepositoryProvider));
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier(this._repository)
    : super(_fromStored(_repository.getThemeMode()));

  final SettingsRepository _repository;

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    await _repository.setThemeMode(mode.name);
  }

  static ThemeMode _fromStored(String? value) {
    return ThemeMode.values.firstWhere(
      (mode) => mode.name == value,
      orElse: () => ThemeMode.system,
    );
  }
}

/// App name + version, read once from the platform.
final packageInfoProvider = FutureProvider<PackageInfo>((ref) {
  return PackageInfo.fromPlatform();
});
