import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireProfile } from "@/lib/profile";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  await prisma.savedOutfit.deleteMany({ where: { id, profileId: auth.id } });
  return NextResponse.json({ ok: true });
}
