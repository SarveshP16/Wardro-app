// Prepares the Android shell before `cap sync`:
//   1. writes android-shell/config.js, so the offline error page's "Try
//      again" button knows where the server is;
//   2. renders the launcher icons and splash screens from public/icons/
//      (once `npx cap add android` has created android/).
//
// Run via `npm run android:sync` (or either APK script).

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { loadServerUrl } from "./server-url.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICON = join(ROOT, "public", "icons", "icon-1024.png");
// Same art as ICON but with the mark inside the maskable safe zone, which
// is also the part of an adaptive-icon foreground every launcher shows.
const MASKABLE_ICON = join(ROOT, "public", "icons", "icon-maskable-512.png");
const ANDROID_RES = join(ROOT, "android", "app", "src", "main", "res");
// The icon's own off-white (see public/icons/icon.svg), so the splash
// screen and the adaptive icon's background match the icon.
const BACKGROUND = "#f4f3f0";

const serverUrl = loadServerUrl();
writeFileSync(
  join(ROOT, "android-shell", "config.js"),
  `window.WARDRO_SERVER_URL = ${JSON.stringify(serverUrl)};\n`,
);
console.log(`server URL: ${serverUrl}`);

async function writePng(path, pipeline) {
  mkdirSync(dirname(path), { recursive: true });
  await pipeline.png().toFile(path);
}

if (existsSync(ANDROID_RES)) {
  const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [density, factor] of Object.entries(DENSITIES)) {
    const dir = join(ANDROID_RES, `mipmap-${density}`);
    const legacy = 48 * factor;
    await writePng(join(dir, "ic_launcher.png"), sharp(ICON).resize(legacy));
    const round = Buffer.from(
      `<svg width="${legacy}" height="${legacy}"><circle cx="${legacy / 2}" cy="${legacy / 2}" r="${legacy / 2}"/></svg>`,
    );
    await writePng(
      join(dir, "ic_launcher_round.png"),
      sharp(ICON)
        .resize(legacy)
        .composite([{ input: round, blend: "dest-in" }]),
    );
    await writePng(
      join(dir, "ic_launcher_foreground.png"),
      sharp(MASKABLE_ICON).resize(108 * factor),
    );
  }

  // Splash screens (pre-Android 12; 12+ draws the launcher icon instead),
  // at the sizes Capacitor's template ships: the icon centered on its
  // own background colour.
  const SPLASH = {
    drawable: [480, 320],
    "drawable-land-mdpi": [480, 320],
    "drawable-land-hdpi": [800, 480],
    "drawable-land-xhdpi": [1280, 720],
    "drawable-land-xxhdpi": [1600, 960],
    "drawable-land-xxxhdpi": [1920, 1280],
    "drawable-port-mdpi": [320, 480],
    "drawable-port-hdpi": [480, 800],
    "drawable-port-xhdpi": [720, 1280],
    "drawable-port-xxhdpi": [960, 1600],
    "drawable-port-xxxhdpi": [1280, 1920],
  };
  for (const [dir, [width, height]] of Object.entries(SPLASH)) {
    const iconSize = Math.round(Math.min(width, height) * 0.35);
    const icon = await sharp(ICON).resize(iconSize).png().toBuffer();
    await writePng(
      join(ANDROID_RES, dir, "splash.png"),
      sharp({ create: { width, height, channels: 4, background: BACKGROUND } }).composite([
        { input: icon, gravity: "center" },
      ]),
    );
  }
  console.log("android icons + splash screens written");
}
