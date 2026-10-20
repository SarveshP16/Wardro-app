import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "./db";
import {
  LOOKS,
  MAX_PROFILE_NAME_LENGTH,
  PROFILE_COLORS,
  THEME_MODES,
  type Look,
  type Profile,
  type ProfileColor,
  type ThemeMode,
} from "./types";

/// Server-only helpers for the active profile. Which profile a device is
/// using lives in a long-lived cookie -- no password, by design: Wardro's
/// access control is the Tailscale network (see README), and profiles
/// just keep each person's wardrobe separate.
const PROFILE_COOKIE = "wardro_profile";

/// One year -- picking a profile is remembered per device until you
/// switch.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;


type ProfileRow = {
  id: string;
  name: string;
  color: string;
  themeMode: string;
  look: string;
};

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    color: (row.color in PROFILE_COLORS ? row.color : "navy") as ProfileColor,
    themeMode: (THEME_MODES.includes(row.themeMode as ThemeMode)
      ? row.themeMode
      : "system") as ThemeMode,
    look: (LOOKS.includes(row.look as Look) ? row.look : "navy") as Look,
  };
}

/// The profile this request's device has selected, or null if none is
/// set (or it was deleted from another device).
export async function getActiveProfile(): Promise<Profile | null> {
  const id = (await cookies()).get(PROFILE_COOKIE)?.value;
  if (!id) return null;
  const row = await prisma.profile.findUnique({ where: { id } });
  return row ? toProfile(row) : null;
}

/// Cookie remembering the last look used on this device, so screens
/// shown before a profile is picked (the profile picker) still match.
const LOOK_COOKIE = "wardro_look";

export function setLookCookie(response: NextResponse, look: Look): void {
  response.cookies.set(LOOK_COOKIE, look, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

/// The look to render this request with: the active profile's, else the
/// device's last-used one, else the default.
export async function resolveLook(profile: Profile | null): Promise<Look> {
  if (profile) return profile.look;
  const remembered = (await cookies()).get(LOOK_COOKIE)?.value;
  return LOOKS.includes(remembered as Look) ? (remembered as Look) : "navy";
}

/// For API routes: resolves the active profile, or produces the 401 to
/// return when there isn't one. Usage:
///
///   const auth = await requireProfile();
///   if (auth instanceof NextResponse) return auth;
///   const profile = auth;
export async function requireProfile(): Promise<Profile | NextResponse> {
  const profile = await getActiveProfile();
  if (!profile) {
    return NextResponse.json(
      { error: "Choose a profile first." },
      { status: 401 },
    );
  }
  return profile;
}

export function setProfileCookie(response: NextResponse, id: string): void {
  response.cookies.set(PROFILE_COOKIE, id, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
  });
}

export function clearProfileCookie(response: NextResponse): void {
  response.cookies.delete(PROFILE_COOKIE);
}

/// Validates a profile name from a request body: trimmed, non-empty,
/// length-capped. Returns the cleaned name or an error message.
export function cleanProfileName(
  name: unknown,
): { name: string } | { error: string } {
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Enter a name." };
  }
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length > MAX_PROFILE_NAME_LENGTH) {
    return {
      error: `Names can be up to ${MAX_PROFILE_NAME_LENGTH} characters.`,
    };
  }
  return { name: trimmed };
}

/// Whether another profile already uses this name (case-insensitively).
export async function profileNameTaken(
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const existing = await prisma.profile.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
}
