"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Look } from "@/lib/types";

const LookContext = createContext<Look>("navy");

/// Makes the current look (resolved server-side in app/layout.tsx)
/// available to client components that render structurally different
/// things per look -- e.g. the outfit flat-lay vs. the lineup. Purely
/// cosmetic differences belong in the token blocks in globals.css
/// instead.
export function LookProvider({
  look,
  children,
}: {
  look: Look;
  children: ReactNode;
}) {
  return <LookContext.Provider value={look}>{children}</LookContext.Provider>;
}

export function useLook(): Look {
  return useContext(LookContext);
}
