import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { isSeason, isStyle } from "@/lib/validate";
import { seasonFromDb, seasonToDb, styleFromDb, styleToDb } from "@/lib/labels";
import type { GeneratedOutfit, SavedOutfit } from "@/lib/types";

type SavedOutfitRow = {
  id: string;
  style: "CASUAL" | "SMART_CASUAL" | "FORMAL" | "EVENING";
  season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" | null;
  title: string;
  rationale: string;
  createdAt: Date;
  items: { itemId: string; position: number }[];
};

function toSavedOutfit(row: SavedOutfitRow): SavedOutfit {
  return {
    id: row.id,
    style: styleFromDb(row.style),
    season: seasonFromDb(row.season),
    title: row.title,
    rationale: row.rationale,
    itemIds: [...row.items]
      .sort((a, b) => a.position - b.position)
      .map((item) => item.itemId),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const rows = await prisma.savedOutfit.findMany({
    where: { profileId: auth.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ outfits: rows.map(toSavedOutfit) });
}

export async function POST(request: NextRequest) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const { style, season, outfit } = body as {
    style?: unknown;
    season?: unknown;
    outfit?: GeneratedOutfit;
  };

  if (
    !isStyle(style) ||
    (season != null && !isSeason(season)) ||
    !Array.isArray(outfit?.itemIds) ||
    outfit.itemIds.length === 0 ||
    !outfit.itemIds.every((id) => typeof id === "string") ||
    typeof outfit.title !== "string" ||
    typeof outfit.rationale !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing outfit data." },
      { status: 400 },
    );
  }

  // Every piece must come from this profile's own wardrobe.
  const uniqueIds = [...new Set(outfit.itemIds)];
  const owned = await prisma.clothingItem.count({
    where: { id: { in: uniqueIds }, profileId: auth.id },
  });
  if (owned !== uniqueIds.length) {
    return NextResponse.json(
      { error: "This outfit includes items that aren't in your wardrobe." },
      { status: 400 },
    );
  }

  const row = await prisma.savedOutfit.create({
    data: {
      id: randomUUID(),
      profileId: auth.id,
      style: styleToDb(style),
      season: season ? seasonToDb(season) : null,
      title: outfit.title,
      rationale: outfit.rationale,
      items: {
        create: outfit.itemIds.map((itemId, position) => ({
          itemId,
          position,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ outfit: toSavedOutfit(row) }, { status: 201 });
}
