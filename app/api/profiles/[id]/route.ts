import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { deleteImage } from "@/lib/imageStore";
import {
  cleanProfileName,
  clearProfileCookie,
  getActiveProfile,
  profileNameTaken,
  toProfile,
} from "@/lib/profile";
import { PROFILE_COLORS } from "@/lib/types";

/// Rename or recolor a profile.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const data: { name?: string; color?: string } = {};

  if (typeof body.name !== "undefined") {
    const cleaned = cleanProfileName(body.name);
    if ("error" in cleaned) {
      return NextResponse.json({ error: cleaned.error }, { status: 400 });
    }
    if (await profileNameTaken(cleaned.name, id)) {
      return NextResponse.json(
        { error: `There's already a profile called ${cleaned.name}.` },
        { status: 409 },
      );
    }
    data.name = cleaned.name;
  }
  if (typeof body.color !== "undefined") {
    if (!(body.color in PROFILE_COLORS)) {
      return NextResponse.json({ error: "Unknown color." }, { status: 400 });
    }
    data.color = body.color;
  }

  const row = await prisma.profile
    .update({ where: { id }, data })
    .catch(() => null);
  if (!row) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  return NextResponse.json({ profile: toProfile(row) });
}

/// Deletes a profile along with its whole wardrobe and saved outfits
/// (rows cascade in the database; the cutout PNGs are removed here).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const items = await prisma.clothingItem.findMany({
    where: { profileId: id },
    select: { id: true },
  });
  await prisma.profile.delete({ where: { id } }).catch(() => null);
  await Promise.all(items.map((item) => deleteImage(item.id)));

  const response = NextResponse.json({ ok: true });
  if ((await getActiveProfile())?.id === id) clearProfileCookie(response);
  return response;
}
