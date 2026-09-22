import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { saveImage } from "@/lib/imageStore";
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

export async function GET() {
  const rows = await prisma.clothingItem.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: rows.map(toItem) });
}

/// Confirms an item staged by /api/wardrobe/items/process: decodes the
/// cutout back to bytes, writes it to the image store under a fresh id,
/// and creates the DB row.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { category, name, dominantColor, cutout } = body as {
    category?: ClothingCategory;
    name?: string | null;
    dominantColor?: number | null;
    cutout?: string;
  };

  if (!category || !cutout) {
    return NextResponse.json(
      { error: "Missing category or image." },
      { status: 400 },
    );
  }

  const id = randomUUID();
  await saveImage(id, Buffer.from(cutout, "base64"));

  const row = await prisma.clothingItem.create({
    data: {
      id,
      category: categoryToDb(category),
      name: name?.trim() ? name.trim() : null,
      dominantColor: dominantColor ?? null,
    },
  });

  return NextResponse.json({ item: toItem(row) }, { status: 201 });
}
