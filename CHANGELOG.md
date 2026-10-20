# Changelog

All notable changes to Wardro are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project does not currently follow semantic versioning strictly, since
it's built for personal use rather than public releases.

## [Unreleased]

### Changed
- **New app icon**, "Spectrum hanger": a graphite hanger holding a band of
  garment colours, on off-white. Used for the Android launcher (adaptive
  and legacy), splash screens, favicon, and README. SVG masters live in
  `public/icons/`.

## [2.1.0] - 2026-10-21

### Added
- **Profiles.** Several people can share one Wardro server: pick yourself
  on the "Who's getting dressed?" screen (by name, no password). Each
  profile has its own wardrobe, saved outfits, and appearance settings;
  each device remembers its profile until you switch (tap your avatar or
  name). Existing data moves into a profile called "Me" on upgrade —
  rename it in Settings.
- **Two looks**, chosen per profile in Settings: *Tailor's navy* (outfits
  as a flat-lay, wardrobe in category rails) and *Colour story* (wardrobe
  spectrum, sort by colour, colour bands with named colours). Both have
  light and dark themes, which are now saved per profile too.
- Wardrobe: category tabs with counts, and sort by newest or by colour.
- Wide screens get a sidebar layout.

### Changed
- **Redesigned UI.** Replaces the ported Material-style screens: the
  Outfits tab is split into Create and Saved, and generation options fold
  away into a summary once results appear.
- Wardrobe images are served as trimmed, downscaled WebP (about 90 KB
  instead of ~4 MB each), so the wardrobe loads far faster.
- **Android app instead of a PWA.** A Capacitor shell (`android/`) that
  loads the same Docker-hosted server over Tailscale (`WARDRO_SERVER_URL`
  in `.env`), with a native "can't reach Wardro" page when the server or
  tailnet is unavailable. Build with `npm run android:release`.
- Removed the service worker and web app manifest.

- New README with screenshots (of an illustrated demo wardrobe), and a
  proper favicon in place of the Next.js default.
- Web image runs on Node 24 LTS (Node 20 is end-of-life).
- Removed unused code and the redundant `pg` dependency.

### Fixed
- Switches' thumbs no longer slide out of their track.

### Security
- The API refuses data-changing requests that a browser marks as coming
  from another site (`proxy.ts`), so a page opened elsewhere can't act on
  Wardro in the background.
- Uploads are capped at 25 MB and must be images; saved cutouts must be
  valid PNGs; categories, occasions, seasons and names are validated.
- Image URLs are validated, so a crafted id can't reach outside the
  images directory.
- Security headers: no framing, no MIME sniffing, same-origin referrers,
  camera/location limited to Wardro itself.
- Dependency updates: Next.js 16.4.2 (fixes a critical RCE and several
  cache-poisoning/SSRF advisories), sharp, Prisma; rembg sidecar on
  FastAPI 0.156 / Starlette 1.9 / python-multipart 0.0.32 / rembg 2.0.85.
- The rembg container runs as a non-root user; both images apply OS
  security updates at build time.

## [2.0.0] - 2026-09-22

### Changed
- **Rebuilt Wardro from scratch as a self-hosted web app.** The Flutter
  (Android/iOS) client, Hive local storage, and on-device ONNX background
  removal are gone, replaced by:
  - Next.js + TypeScript (App Router) for the UI and API routes.
  - Postgres (via Prisma) for wardrobe items, saved outfits, and settings.
  - A Python/FastAPI sidecar wrapping `rembg` for server-side background
    removal (services/rembg/).
  - Wardrobe images stored on a Docker volume instead of the device's
    documents directory.
  - `ANTHROPIC_API_KEY` moved server-side (read only by the `web`
    container) instead of a client build-define, now that the app has a
    real backend — see README.
  - Docker Compose (`web` + `rembg` + `db`) for deployment on a
    self-hosted box, reachable over Tailscale; installable as a PWA.
- Outfit-generation logic (AI Stylist prompt/schema, Quick Match's
  color-harmony scoring, the Sanzo Wada dataset) and the weather feature
  were ported behavior-for-behavior — same outputs, new stack.

## [1.0.0] - 2026-09-08

### Added
- Real app icon (clay/cream split background, navy hanger mark, color-swatch
  dots) for both Android (legacy + adaptive icon) and iOS (full
  `AppIcon.appiconset`), replacing the Flutter default. Master files kept at
  `assets/branding/`.

### Changed
- Version bumped to 1.0.0. The Settings screen's version string
  (`lib/features/settings/application/settings_providers.dart`) reads it via
  `package_info_plus` from the native build metadata, which Flutter
  generates from this file's `version:` field at build time — so it always
  reflects whatever's in `pubspec.yaml`, nothing to keep in sync by hand.

## [0.1.0] - 2026-09-08

Initial snapshot: digital wardrobe with background removal, two outfit
generation modes, and a small Settings screen.

### Added
- Wardrobe MVP: add clothing items by camera/gallery, on-device background
  removal, dominant-color extraction, and category filtering (Top, Bottom,
  Outerwear, Shoes).
- Quick Match: a free, on-device outfit generator using Sanzo Wada
  color-harmony data, with outerwear/shoes toggles and an outfit-count
  control.
- AI Stylist: an occasion-aware outfit generator (Casual, Smart Casual,
  Formal, Evening) that sends wardrobe photos to Claude and returns 2–4
  curated combinations with a rationale each.
- Wardrobe item editing and a Settings screen (theme mode, app info).
- Saved outfits.

### Changed
- Background removal backend swapped from `local_rembg` to
  `image_background_remover`.
- AI Stylist now calls `api.anthropic.com` directly from the app instead of
  going through a Firebase Cloud Function proxy — this app is for personal
  use only, so there's no untrusted audience the API key needs to be
  hidden from. See the README's Configuration section.

### Fixed
- Dark-colored garment cutouts no longer render as a blank black square
  (photo backdrop is now a fixed neutral, independent of theme).
