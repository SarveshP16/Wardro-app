# Wardro

AI-powered outfit generator and digital wardrobe — a self-hosted web app.
Runs as a small set of Docker containers on your own machine and is meant
to be reached over your own [Tailscale](https://tailscale.com) network,
from a browser or the Android app.

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

## Android app

The APK is a thin [Capacitor](https://capacitorjs.com) shell: a native
WebView that loads the Wardro server over Tailscale. The UI isn't bundled
into it, so server updates (`docker compose up --build`) show up in the
app without rebuilding the APK. If the server can't be reached, the app
shows a "Can't reach Wardro" page with a retry button
(`android-shell/error.html`).

Needs Android Studio, or the Android SDK plus JDK 21.

1. Set where the phone should find the server in `.env` — your Docker
   host's Tailscale IP or MagicDNS name, plus the port:
   ```env
   WARDRO_SERVER_URL="http://100.x.y.z:3000"
   ```
   This is baked into the APK, so rebuild it if the address changes.
2. Build:

| Command | What it does |
| --- | --- |
| `npm run android:sync` | Regenerate icons + error-page config and sync `android/` |
| `npm run android:open` | Open the project in Android Studio |
| `npm run android:apk` | Debug APK → `android/app/build/outputs/apk/debug/app-debug.apk` |
| `npm run android:release` | Signed release APK → `android/app/build/outputs/apk/release/app-release.apk` |

3. Copy the APK to your phone and install it (allow installs from unknown
   sources). Tailscale must be connected on the phone.

Plain `http://` is fine — Tailscale encrypts the traffic — but the
WebView, like a browser, only allows "use my location" for weather on
`https://`. For that, put the server behind
[`tailscale serve`](https://tailscale.com/kb/1312/serve) and use its
`https://<machine>.<tailnet>.ts.net` URL; otherwise set the weather
location manually.

### Signing a release APK

Release builds are signed using `android/keystore.properties`, which is
**gitignored**, as are all `*.jks`/`*.keystore` files:

```sh
keytool -genkeypair -v -keystore android/wardro-release.jks -storetype PKCS12   -alias wardro -keyalg RSA -keysize 4096 -validity 10000
```

```properties
storeFile=../wardro-release.jks
storePassword=your-store-password
keyAlias=wardro
keyPassword=your-key-password
```

Without this file, `android:release` still builds, but unsigned.

> **Back up the keystore and its password.** Android only accepts updates
> signed with the same key; lose it and you have to uninstall and
> reinstall the app.

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
android/                Capacitor Android project (the APK)
android-shell/          local pages bundled into the APK (offline error page)
scripts/                APK build helpers (server URL, icons, splash screens)
prisma/schema.prisma    data model (Postgres via Prisma)
data/                   the Sanzo Wada color dataset (see its LICENSE.md)
services/rembg/         the background-removal sidecar (FastAPI + rembg)
```

## Support

If Wardro App is useful to you, you can support its development on Ko-fi:
[ko-fi.com/crystaxit](https://ko-fi.com/crystaxit).


## History

Wardro started as a Flutter app (Android + iOS) storing everything
on-device. It was rebuilt as this self-hosted web app to run from one
Docker host and be reachable from every device on the user's Tailscale
network — see `CHANGELOG.md`.
