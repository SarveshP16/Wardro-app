import type { CapacitorConfig } from "@capacitor/cli";

import { loadServerUrl } from "./scripts/server-url.mjs";

// The Android app is a thin native shell around the same Next.js app the
// Docker stack serves: the WebView loads WARDRO_SERVER_URL (your Docker
// host, over Tailscale) directly, so there's no bundled copy of the UI to
// keep in sync -- server changes show up in the app on the next launch.
// `android-shell/` only holds the page shown when that URL can't be
// reached (phone off the tailnet, host asleep, ...).
const serverUrl = loadServerUrl();

const config: CapacitorConfig = {
  appId: "com.wardro.app",
  appName: "Wardro",
  webDir: "android-shell",
  server: {
    url: serverUrl,
    // Plain http://<tailscale-host>:3000 is fine -- Tailscale already
    // encrypts the traffic -- but Android blocks cleartext by default.
    cleartext: serverUrl.startsWith("http:"),
    errorPath: "error.html",
  },
  plugins: {
    // Keep the WebView clear of the status/navigation bars, so the web
    // app's layout needs no safe-area CSS.
    SystemBars: {
      insetsHandling: "native",
    },
  },
};

export default config;
