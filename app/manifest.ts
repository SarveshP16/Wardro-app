import type { MetadataRoute } from "next";

/// Web app manifest, so Wardro can be added to a home screen and open
/// full-screen like an app: "Add to Home Screen" in Safari on iPhone/iPad
/// (see `appleWebApp` in app/layout.tsx), or "Install app" in Chrome. The
/// Android APK doesn't need it -- it's a native shell around the same
/// server.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wardro",
    short_name: "Wardro",
    description: "Your wardrobe, photographed, sorted and styled.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // The icon's own off-white (public/icons/icon.svg) for the launch
    // screen; the status bar then follows the active look and theme (see
    // app/theme-color-sync.tsx).
    background_color: "#f4f3f0",
    theme_color: "#f4f3f0",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
