import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireProfile, setLookCookie } from "@/lib/profile";
import { isGender } from "@/lib/validate";
import {
  LOOKS,
  THEME_MODES,
  type Gender,
  type Look,
  type ThemeMode,
} from "@/lib/types";

/// The active profile's settings -- `themeMode` (light/dark), `look`
/// (visual style) and `gender` (which clothing categories are offered). Stored server-side on the Profile so a
/// person's choice follows them to every device on the Tailscale network.
export async function GET() {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    themeMode: auth.themeMode,
    look: auth.look,
    gender: auth.gender,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const data: { themeMode?: ThemeMode; look?: Look; gender?: Gender } = {};

  if (typeof body.themeMode !== "undefined") {
    if (!THEME_MODES.includes(body.themeMode)) {
      return NextResponse.json(
        { error: "Invalid theme mode." },
        { status: 400 },
      );
    }
    data.themeMode = body.themeMode;
  }
  if (typeof body.look !== "undefined") {
    if (!LOOKS.includes(body.look)) {
      return NextResponse.json({ error: "Invalid look." }, { status: 400 });
    }
    data.look = body.look;
  }

  if (typeof body.gender !== "undefined") {
    if (!isGender(body.gender)) {
      return NextResponse.json({ error: "Invalid gender." }, { status: 400 });
    }
    data.gender = body.gender;
  }

  const row = await prisma.profile.update({ where: { id: auth.id }, data });
  const response = NextResponse.json({
    themeMode: row.themeMode,
    look: row.look,
    gender: row.gender,
  });
  if (data.look) setLookCookie(response, data.look);
  return response;
}
