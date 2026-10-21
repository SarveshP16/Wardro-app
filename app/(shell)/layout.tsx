import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getActiveProfile } from "@/lib/profile";

import { AppNav } from "./app-nav";
import { ProfileProvider } from "./profile-context";

/// Persistent shell wrapping each top-level tab. A route group (no effect
/// on the URL) so /wardrobe, /outfits, and /settings all render inside
/// it. Devices that haven't picked a profile yet (or whose profile was
/// deleted elsewhere) go to the profile picker first.
export default async function ShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getActiveProfile();
  if (!profile) redirect("/profiles");

  return (
    <ProfileProvider profile={profile}>
      <div className="flex min-h-app flex-col md:flex-row">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
            {children}
          </div>
        </main>
        <AppNav />
      </div>
    </ProfileProvider>
  );
}
