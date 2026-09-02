/// Build-time configuration, supplied via `--dart-define-from-file` (see
/// `dart_define.example.json` at the repo root — copy it to
/// `dart_define.json`, fill in real values, and pass
/// `--dart-define-from-file=dart_define.json` to every `flutter run`/
/// `flutter build`). Never commit real values for these.
class AppConfig {
  AppConfig._();

  /// Anthropic API key used by the AI Stylist to call Claude directly from
  /// the app. This app is built for personal/self-hosted use only (not
  /// distributed via app stores), so there's no untrusted audience to hide
  /// the key from — see project memory for why there's no backend proxy.
  static const anthropicApiKey = String.fromEnvironment('ANTHROPIC_API_KEY');
}
