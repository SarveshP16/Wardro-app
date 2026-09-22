import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { deleteImage } from "@/lib/imageStore";
import { categoryFromDb, categoryToDb } from "@/lib/labels";
import { ClothingCategory, ClothingItem } from "@/lib/types";

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
  const { id } = await params;
  const row = await prisma.clothingItem.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ item: toItem(row) });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { name, category } = body as {
    name?: string | null;
    category?: ClothingCategory;
  };

  const data: { name?: string | null; category?: ReturnType<typeof categoryToDb> } = {};
  if (typeof name !== "undefined") {
    data.name = name?.trim() ? name.trim() : null;
  }
  if (typeof category !== "undefined") {
    data.category = categoryToDb(category);
  }

  const row = await prisma.clothingItem.update({ where: { id }, data });
  return NextResponse.json({ item: toItem(row) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.clothingItem.delete({ where: { id } }).catch(() => null);
  await deleteImage(id);
  return NextResponse.json({ ok: true });
}
