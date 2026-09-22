# Wardro

AI-powered outfit generator and digital wardrobe — a self-hosted web app.
Runs as a small set of Docker containers on your own machine and is meant
to be reached over your own [Tailscale](https://tailscale.com) network,
installable as a PWA on your phone's home screen.

Wardro is built for **personal use only** — one wardrobe, no accounts, no
public distribution. Access control is entirely at the network level:
whoever is on your tailnet can open the app; there's no in-app login.

## What it does

- **Wardrobe**: photograph or upload clothing items; Wardro removes the
  background (server-side, via [rembg](https://github.com/danielgatis/rembg))
  and tags each item's dominant color automatically.
- **Outfits**, two engines:
  - **Quick Match** — free, fully offline, ranks combinations from your
    wardrobe purely by color harmony (a curated
    [Sanzo Wada](https://en.wikipedia.org/wiki/Sanzo_Wada) palette blended
    with a geometric hue-distance model).
  - **AI Stylist** — sends your wardrobe photos to Claude for
    occasion-aware, weather-aware outfit suggestions. Needs your own
    Anthropic API key.
- **Weather**: optional, via [Open-Meteo](https://open-meteo.com) (no API
  key needed) and your browser's location.
- Save the outfits you like; light/dark/system theme.

## Architecture

Three containers (`docker-compose.yml`):

| Service | What | Notes |
|---|---|---|
| `web` | Next.js app (UI + API routes) | The only port published (3000) |
| `rembg` | Python/FastAPI background-removal sidecar | Internal only |
| `db` | Postgres | Internal only |

Wardrobe photos live on a Docker volume (`wardrobe-images`), one PNG per
item. Your `ANTHROPIC_API_KEY` is read only by the `web` container's
server-side code (`lib/anthropic.ts`) — it's never sent to the browser.

## Running it

1. Copy the env template and fill in your Anthropic key:
   ```sh
   cp .env.example .env
   ```
2. Build and start everything:
   ```sh
   docker compose up --build
   ```
3. Open `http://localhost:3000` (or your Tailscale machine name/IP once
   deployed) — Wardrobe tab first.

To install it as a PWA: open the app in Chrome (Android) or Safari
(iOS) over your Tailscale connection, then "Add to Home Screen" /
"Install app".

### Local development (without Docker)

Needs Node 20+, a local Postgres, and a running `rembg` sidecar (or point
`REMBG_URL` at one running elsewhere).

```sh
npm install
npx prisma migrate dev
npm run dev
```

## Project layout

```
app/                    Next.js App Router pages + API routes
  (shell)/               bottom-nav shell: wardrobe / outfits / settings
  api/                    server-side routes (items, outfits, images, settings)
lib/                    ported domain logic (color harmony, Quick Match,
                        weather, AI Stylist call, image storage) + API client
components/             UI components, grouped by feature
prisma/schema.prisma    data model (Postgres via Prisma)
data/                   the Sanzo Wada color dataset (see its LICENSE.md)
services/rembg/         the background-removal sidecar (FastAPI + rembg)
```

## Support

If Vital Loop is useful to you, you can support its development on Ko-fi:
[ko-fi.com/crystaxit](https://ko-fi.com/crystaxit).


## History

Wardro started as a Flutter app (Android + iOS) storing everything
on-device. It was rebuilt as this self-hosted web app to run from one
Docker host and be reachable from every device on the user's Tailscale
network — see `CHANGELOG.md`.
