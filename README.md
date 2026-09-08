# Wardro

A personal digital wardrobe and outfit generator, built with Flutter. Snap a
photo of a clothing item, Wardro cuts it out and files it away, and then
helps you put outfits together — either instantly on-device or with an AI
stylist for occasions that matter.

> **Note:** Wardro is built for personal/self-hosted use, not app-store
> distribution. See [Configuration](#configuration) for what that means for
> the AI Stylist's API key.

## Features

- **Digital wardrobe** — photograph a clothing item (camera or gallery) and
  Wardro automatically removes the background on-device, extracts its
  dominant color, and files it under Top / Bottom / Outerwear / Shoes.
  Items can be viewed, edited, and re-categorized later.
- **Quick Match** — a free, fully on-device outfit generator. It matches
  colors using Sanzo Wada's classic color-harmony data, with toggles for
  outerwear/shoes inclusion and how many outfits to generate. No network
  call, no API key required.
- **AI Stylist** — sends your wardrobe photos to Claude (Anthropic) with a
  chosen occasion (Casual / Smart Casual / Formal / Evening) and gets back
  2–4 curated outfit combinations with a short rationale for each.
- **Save & revisit outfits**, light/dark theme, and a small Settings screen.

## Tech stack

- **Flutter** (Dart ^3.13.2), Material 3
- **State management:** Riverpod
- **Navigation:** go_router
- **Local-first storage:** Hive (no backend, no account system)
- **On-device background removal:** `image_background_remover`
- **AI Stylist:** direct HTTPS calls to `api.anthropic.com/v1/messages`
  (Claude), no server in between

## Project structure

```
lib/
  core/            # config, router, storage, theme, shared widgets
  features/
    wardrobe/      # add/edit/view clothing items, background removal
    outfits/       # Quick Match + AI Stylist generation, saved outfits
    settings/       # theme, about
```

Each feature follows a `domain / data / application / presentation`
split — plain models, repositories (Hive-backed), Riverpod providers, and
screens/widgets, respectively.

## Getting started

### Prerequisites

- Flutter SDK matching `environment.sdk` in `pubspec.yaml` (Dart ^3.13.2)
- A device/emulator (Android or iOS) — camera access is used for adding
  wardrobe items

### Setup

```bash
flutter pub get
```

### Configuration

The AI Stylist calls Anthropic directly from the app using your own API
key, supplied at build time (never committed):

1. Copy the template:
   ```bash
   cp dart_define.example.json dart_define.json
   ```
2. Edit `dart_define.json` and set your real key:
   ```json
   { "ANTHROPIC_API_KEY": "sk-ant-..." }
   ```
3. Always run/build with that file:
   ```bash
   flutter run --dart-define-from-file=dart_define.json
   ```

`dart_define.json` is gitignored. Without it, the AI Stylist shows a
friendly "not configured yet" error — **Quick Match works with no key at
all.**

Why a key baked into the client is fine here: Wardro isn't distributed to
other people's devices, so there's no untrusted audience to hide it from.
If that ever changes (App Store/Play Store, or wide adoption), this needs
revisiting — see the code comments in `lib/core/config/app_config.dart` and
`lib/features/outfits/services/outfit_generation_service.dart`.

### Running

```bash
flutter run --dart-define-from-file=dart_define.json
```

## Roadmap

- Weather/season-aware outfit suggestions
- Backup/export from Settings
- BYOK (per-user Anthropic key via Settings), if this ever moves beyond
  personal use

## License

MIT — see [LICENSE](LICENSE).
