import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireProfile, setLookCookie } from "@/lib/profile";
import { LOOKS, THEME_MODES, type Look, type ThemeMode } from "@/lib/types";

/// The active profile's appearance settings -- `themeMode` (light/dark)
/// and `look` (visual style). Stored server-side on the Profile so a
/// person's choice follows them to every device on the Tailscale network.
export async function GET() {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ themeMode: auth.themeMode, look: auth.look });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const data: { themeMode?: ThemeMode; look?: Look } = {};

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

  const row = await prisma.profile.update({ where: { id: auth.id }, data });
  const response = NextResponse.json({
    themeMode: row.themeMode,
    look: row.look,
  });
  if (data.look) setLookCookie(response, data.look);
  return response;
}
