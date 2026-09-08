# Changelog

All notable changes to Wardro are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project does not currently follow semantic versioning strictly, since
it's built for personal use rather than public releases.

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
