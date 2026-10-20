"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/// Keeps the browser/OS chrome colour (`<meta name="theme-color">`) equal
/// to the page background of the current look and theme -- the status bar
/// when Wardro runs from an iPhone home screen, the title bar of an
/// installed app in Chrome. The static values in app/layout.tsx only
/// cover the first paint.
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
      if (!bg) return;
      for (const meta of document.querySelectorAll<HTMLMetaElement>(
        'meta[name="theme-color"]',
      )) {
        if (meta.content !== bg) meta.content = bg;
      }
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
