import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { seasonFromDb, seasonToDb, styleFromDb, styleToDb } from "@/lib/labels";
import { GeneratedOutfit, OutfitStyle, SavedOutfit, Season } from "@/lib/types";

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
  const rows = await prisma.savedOutfit.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ outfits: rows.map(toSavedOutfit) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { style, season, outfit } = body as {
    style?: OutfitStyle;
    season?: Season | null;
    outfit?: GeneratedOutfit;
  };

  if (!style || !outfit?.itemIds?.length) {
    return NextResponse.json(
      { error: "Missing outfit data." },
      { status: 400 },
    );
  }

  const row = await prisma.savedOutfit.create({
    data: {
      id: randomUUID(),
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
