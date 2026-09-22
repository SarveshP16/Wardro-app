"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/// Wraps next-themes, toggling a `.dark` class on <html> (see the
/// `@custom-variant dark` line in globals.css). Persists to
/// localStorage instantly for the current device and to
/// /api/settings in the background so every device on the Tailscale
/// network converges on the same choice — see settings/page.tsx.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
