"use client";

import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, type ReactNode } from "react";

import type { Profile } from "@/lib/types";

const ProfileContext = createContext<Profile | null>(null);

/// The active profile, resolved server-side by the shell layout. Also
/// applies the profile's saved theme on load, so a person's light/dark
/// choice follows them across devices.
export function ProfileProvider({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(profile.themeMode);
  }, [profile.themeMode, setTheme]);

  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): Profile {
  const profile = useContext(ProfileContext);
  if (!profile) {
    throw new Error("useProfile() must be used inside the app shell.");
  }
  return profile;
}
