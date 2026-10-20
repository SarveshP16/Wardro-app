import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { deleteImage } from "@/lib/imageStore";
import { requireProfile } from "@/lib/profile";
import { cleanItemName, isCategory } from "@/lib/validate";
import { categoryFromDb, categoryToDb } from "@/lib/labels";
import type { ClothingItem } from "@/lib/types";

function toItem(row: {
  id: string;
  category: "TOP" | "BOTTOM" | "OUTERWEAR" | "SHOES";
  name: string | null;
  dominantColor: number | null;
  createdAt: Date;
}): ClothingItem {
  return {
    id: row.id,
    category: categoryFromDb(row.category),
    name: row.name,
    dominantColor: row.dominantColor,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const row = await prisma.clothingItem.findFirst({
    where: { id, profileId: auth.id },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ item: toItem(row) });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await request.json();
  const { name, category } = body as { name?: unknown; category?: unknown };

  const data: { name?: string | null; category?: ReturnType<typeof categoryToDb> } = {};
  if (typeof name !== "undefined") {
    const cleanName = cleanItemName(name);
    if (cleanName === undefined) {
      return NextResponse.json({ error: "That name is too long." }, { status: 400 });
    }
    data.name = cleanName;
  }
  if (typeof category !== "undefined") {
    if (!isCategory(category)) {
      return NextResponse.json({ error: "Unknown category." }, { status: 400 });
    }
    data.category = categoryToDb(category);
  }

  // updateMany so the profile filter applies -- an item from another
  // profile is just "not found" here.
  const { count } = await prisma.clothingItem.updateMany({
    where: { id, profileId: auth.id },
    data,
  });
  if (count === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const row = await prisma.clothingItem.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({ item: toItem(row) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const { count } = await prisma.clothingItem.deleteMany({
    where: { id, profileId: auth.id },
  });
  if (count > 0) await deleteImage(id);
  return NextResponse.json({ ok: true });
}
