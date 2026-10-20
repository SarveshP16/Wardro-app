"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/// Wraps next-themes, toggling a `.dark` class on <html> (see the
/// `@custom-variant dark` line in globals.css). The source of truth is
/// the active profile's `themeMode` (see app/(shell)/profile-context.tsx,
/// which applies it on load); next-themes' localStorage copy just avoids
/// a flash before that happens.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
