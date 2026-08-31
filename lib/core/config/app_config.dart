/// Build-time configuration, supplied via `--dart-define-from-file` (see
/// `dart_define.example.json` at the repo root — copy it to
/// `dart_define.json`, fill in real values, and pass
/// `--dart-define-from-file=dart_define.json` to every `flutter run`/
/// `flutter build`). Never commit real values for these.
class AppConfig {
  AppConfig._();

  /// HTTPS URL of the deployed `generate_outfit` Cloud Function.
  static const outfitFunctionUrl = String.fromEnvironment(
    'OUTFIT_FUNCTION_URL',
  );

  /// Shared secret sent as the `X-Wardro-App-Key` header — a stopgap abuse
  /// guard until real accounts/App Check exist, not a substitute for the
  /// Anthropic key itself (which never leaves the Cloud Function). See
  /// project memory for why this exists.
  static const appSharedSecret = String.fromEnvironment('APP_SHARED_SECRET');
}
