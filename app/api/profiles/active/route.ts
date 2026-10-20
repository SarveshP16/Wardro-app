import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  clearProfileCookie,
  setLookCookie,
  setProfileCookie,
  toProfile,
} from "@/lib/profile";

/// Switches this device to another profile.
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const row =
    typeof body.id === "string"
      ? await prisma.profile.findUnique({ where: { id: body.id } })
      : null;
  if (!row) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const profile = toProfile(row);
  const response = NextResponse.json({ profile });
  setProfileCookie(response, row.id);
  setLookCookie(response, profile.look);
  return response;
}

/// Forgets this device's profile choice (back to the picker).
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearProfileCookie(response);
  return response;
}
