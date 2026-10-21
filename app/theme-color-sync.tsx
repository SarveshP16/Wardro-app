"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/// Keeps the system chrome in step with the current look and theme:
/// - `<meta name="theme-color">` = the page background -- the status bar
///   when Wardro runs from an iPhone home screen, the title bar of an
///   installed app in Chrome. (The static values in app/layout.tsx only
///   cover the first paint.)
/// - In the Android app, the status bar's icon colour (light icons on a
///   dark theme, dark on light) -- otherwise it follows the phone's own
///   dark mode, not Wardro's.
///
/// Watches <html> itself rather than React state: next-themes applies
/// the `dark` class (and Settings the `data-look` attribute) after this
/// component's effects would run, so reading on state change would see
/// the previous colours.
export function ThemeColorSync() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    function sync() {
      const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
      if (bg) {
        for (const meta of document.querySelectorAll<HTMLMetaElement>(
          'meta[name="theme-color"]',
        )) {
          if (meta.content !== bg) meta.content = bg;
        }
      }
      void setNativeStatusBar(root.classList.contains("dark"));
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-look"],
    });
    // Navigation can re-render the metadata tags with their static values.
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

let lastNativeDark: boolean | null = null;

/// Android app only (a no-op in browsers, where Capacitor isn't loaded).
async function setNativeStatusBar(dark: boolean) {
  if (dark === lastNativeDark) return;
  if (!("Capacitor" in window)) return;
  const { Capacitor, SystemBars, SystemBarsStyle } = await import(
    "@capacitor/core"
  );
  if (!Capacitor.isNativePlatform()) return;
  lastNativeDark = dark;
  await SystemBars.setStyle({
    // DARK = light icons, for a dark background; LIGHT = the reverse.
    style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
  }).catch(() => {
    lastNativeDark = null;
  });
}
