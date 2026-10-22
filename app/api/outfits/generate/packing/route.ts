import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { generateAiPackingList } from "@/lib/anthropic";
import { itemFromRow } from "@/lib/items";
import { requireProfile } from "@/lib/profile";
import { cleanExcludeCombos, isSeason, isStyle } from "@/lib/validate";
import { MAX_TRIP_DAYS } from "@/lib/packingList";
import {
  ClothingItem,
  OutfitGenerationError,
  OutfitStyle,
  PackingDayInput,
  Season,
} from "@/lib/types";

/// Packing List's generation endpoint -- like
/// app/api/outfits/generate/ai/route.ts, but plans a whole date range in
/// one AI Stylist call instead of a single batch of alternatives.
export async function POST(request: NextRequest) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const {
    style,
    includeOuterwear = true,
    includeShoes = true,
    season,
    days,
    outfitCount,
    excludeCombos,
  } = body as {
    style?: OutfitStyle;
    includeOuterwear?: boolean;
    includeShoes?: boolean;
    season?: Season | null;
    days?: PackingDayInput[];
    outfitCount?: number;
    excludeCombos?: string[][];
  };

  if (!isStyle(style)) {
    return NextResponse.json({ error: "Missing style." }, { status: 400 });
  }
  if (season != null && !isSeason(season)) {
    return NextResponse.json({ error: "Unknown season." }, { status: 400 });
  }
  if (!Array.isArray(days) || days.length === 0) {
    return NextResponse.json(
      { error: "Add at least one day to plan a trip." },
      { status: 400 },
    );
  }
  if (days.length > MAX_TRIP_DAYS) {
    return NextResponse.json(
      { error: `Trips are limited to ${MAX_TRIP_DAYS} days.` },
      { status: 400 },
    );
  }

  const rows = await prisma.clothingItem.findMany({
    where: { profileId: auth.id },
  });
  const items: ClothingItem[] = rows.map(itemFromRow);

  try {
    const packingDays = await generateAiPackingList({
      items,
      style,
      gender: auth.gender,
      includeOuterwear,
      includeShoes,
      season: season ?? null,
      days,
      outfitCount:
        typeof outfitCount === "number" && Number.isFinite(outfitCount)
          ? outfitCount
          : undefined,
      excludeCombos: cleanExcludeCombos(excludeCombos),
    });
    return NextResponse.json({ days: packingDays });
  } catch (error) {
    const message =
      error instanceof OutfitGenerationError
        ? error.message
        : "Outfit generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
