import type { ReactNode } from "react";

import { BottomNav } from "./bottom-nav";

/// Persistent shell wrapping each top-level tab — port of
/// `app_shell.dart`. A route group (no effect on the URL) so /wardrobe,
/// /outfits, and /settings all render inside it.
export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
