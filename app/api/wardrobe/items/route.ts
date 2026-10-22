import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { saveImage } from "@/lib/imageStore";
import { requireProfile } from "@/lib/profile";
import { itemFromRow } from "@/lib/items";
import { categoryToDb } from "@/lib/labels";
import { cleanCategories, cleanItemName, decodePngCutout } from "@/lib/validate";

export async function GET() {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const rows = await prisma.clothingItem.findMany({
    where: { profileId: auth.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: rows.map(itemFromRow) });
}

/// Confirms an item staged by /api/wardrobe/items/process: decodes the
/// cutout back to bytes, writes it to the image store under a fresh id,
/// and creates the DB row.
export async function POST(request: NextRequest) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const { categories, name, dominantColor, cutout } = body as {
    categories?: unknown;
    name?: unknown;
    dominantColor?: unknown;
    cutout?: unknown;
  };

  const cleanCats = cleanCategories(categories);
  if (!cleanCats) {
    return NextResponse.json({ error: "Choose a category." }, { status: 400 });
  }
  const cleanName = cleanItemName(name);
  if (cleanName === undefined) {
    return NextResponse.json({ error: "That name is too long." }, { status: 400 });
  }
  const png = await decodePngCutout(cutout);
  if (!png) {
    return NextResponse.json(
      { error: "The image is missing or isn't a valid cutout." },
      { status: 400 },
    );
  }
  const color =
    typeof dominantColor === "number" &&
    Number.isInteger(dominantColor) &&
    dominantColor >= 0 &&
    dominantColor <= 0xffffff
      ? dominantColor
      : null;

  const id = randomUUID();
  await saveImage(id, png);

  const row = await prisma.clothingItem.create({
    data: {
      id,
      profileId: auth.id,
      categories: cleanCats.map(categoryToDb),
      name: cleanName,
      dominantColor: color,
    },
  });

  return NextResponse.json({ item: itemFromRow(row) }, { status: 201 });
}
