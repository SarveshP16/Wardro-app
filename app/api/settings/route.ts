import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const THEME_KEY = "themeMode";
const VALID_MODES = ["system", "light", "dark"];

/// Replaces the Hive settings box. Server-side so the setting is
/// consistent across every device on the Tailscale network, rather than
/// per-install like the original.
export async function GET() {
  const row = await prisma.setting.findUnique({ where: { key: THEME_KEY } });
  return NextResponse.json({ themeMode: row?.value ?? "system" });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const value = body.themeMode as string;
  if (!VALID_MODES.includes(value)) {
    return NextResponse.json(
      { error: "Invalid theme mode." },
      { status: 400 },
    );
  }
  await prisma.setting.upsert({
    where: { key: THEME_KEY },
    create: { key: THEME_KEY, value },
    update: { value },
  });
  return NextResponse.json({ themeMode: value });
}
