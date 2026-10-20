import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  cleanProfileName,
  getActiveProfile,
  profileNameTaken,
  setLookCookie,
  setProfileCookie,
  toProfile,
} from "@/lib/profile";
import { PROFILE_COLORS, type ProfileColor } from "@/lib/types";

/// Everyone on this Wardro server, plus which one this device has
/// selected (null if none) -- feeds the profile picker. `colors` is each
/// wardrobe's dominant colors (Colour story draws them as a stripe under
/// each name).
export async function GET() {
  const [rows, colorRows, active] = await Promise.all([
    prisma.profile.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.clothingItem.findMany({
      where: { dominantColor: { not: null } },
      select: { profileId: true, dominantColor: true },
    }),
    getActiveProfile(),
  ]);
  const colorsByProfile = new Map<string, number[]>();
  for (const { profileId, dominantColor } of colorRows) {
    const list = colorsByProfile.get(profileId) ?? [];
    list.push(dominantColor as number);
    colorsByProfile.set(profileId, list);
  }
  return NextResponse.json({
    profiles: rows.map((row) => ({
      ...toProfile(row),
      itemCount: row._count.items,
      colors: colorsByProfile.get(row.id) ?? [],
    })),
    activeId: active?.id ?? null,
  });
}

/// Creates a profile and makes it this device's active one, so the
/// picker can drop straight into the new (empty) wardrobe.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const cleaned = cleanProfileName(body.name);
  if ("error" in cleaned) {
    return NextResponse.json({ error: cleaned.error }, { status: 400 });
  }
  if (await profileNameTaken(cleaned.name)) {
    return NextResponse.json(
      { error: `There's already a profile called ${cleaned.name}.` },
      { status: 409 },
    );
  }

  const color: ProfileColor =
    body.color in PROFILE_COLORS ? body.color : "navy";
  // A new profile starts in whichever look this device is already using.
  const look = (await getActiveProfile())?.look ?? "navy";
  const row = await prisma.profile.create({
    data: { name: cleaned.name, color, look },
  });

  const profile = toProfile(row);
  const response = NextResponse.json({ profile }, { status: 201 });
  setProfileCookie(response, row.id);
  setLookCookie(response, profile.look);
  return response;
}
