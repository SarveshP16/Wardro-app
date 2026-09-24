// Reads WARDRO_SERVER_URL -- where the Android app should find the Wardro
// server -- from the environment or .env. Shared by capacitor.config.ts
// and scripts/android-prepare.mjs so both always agree.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ENV_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");

export function loadServerUrl() {
  if (!process.env.WARDRO_SERVER_URL && existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
  }
  const raw = process.env.WARDRO_SERVER_URL?.trim();
  if (!raw) {
    throw new Error(
      "WARDRO_SERVER_URL is not set. Add it to .env (see .env.example), " +
        "e.g. WARDRO_SERVER_URL=http://my-pc:3000",
    );
  }
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`WARDRO_SERVER_URL must be http(s), got ${raw}`);
  }
  // Capacitor treats server.url as an origin + optional path; drop any
  // trailing slash so it doesn't end up doubled.
  return url.href.replace(/\/$/, "");
}
