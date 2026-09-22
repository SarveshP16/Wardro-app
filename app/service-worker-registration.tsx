"use client";

import { useEffect } from "react";

/// Registers public/sw.js on mount. A tiny client component rather than
/// inline script so it only ever runs in the browser.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal -- the app works fine without offline support.
      });
    }
  }, []);

  return null;
}
