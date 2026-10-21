import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { generateAiOutfits } from "@/lib/anthropic";
import { categoryFromDb } from "@/lib/labels";
import { loadSeenOutfits, recordSuggestions } from "@/lib/outfitHistory";
import { requireProfile } from "@/lib/profile";
import { cleanExcludeCombos, isSeason, isStyle } from "@/lib/validate";
import {
  ClothingItem,
  OutfitGenerationError,
  OutfitStyle,
  Season,
  WeatherSnapshot,
} from "@/lib/types";

/// The AI Stylist. Server-side only -- this is the one place
/// ANTHROPIC_API_KEY is ever read (see lib/anthropic.ts). Never repeats an
/// outfit this profile has been shown before or has saved (see
/// lib/outfitHistory.ts).
export async function POST(request: NextRequest) {
  const auth = await requireProfile();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const {
    style,
    includeOuterwear = true,
    includeShoes = true,
    weather,
    season,
    excludeCombos,
  } = body as {
    style?: OutfitStyle;
    includeOuterwear?: boolean;
    includeShoes?: boolean;
    weather?: WeatherSnapshot | null;
    season?: Season | null;
    excludeCombos?: string[][];
  };

  if (!isStyle(style)) {
    return NextResponse.json({ error: "Missing style." }, { status: 400 });
  }
  if (season != null && !isSeason(season)) {
    return NextResponse.json({ error: "Unknown season." }, { status: 400 });
  }

  const rows = await prisma.clothingItem.findMany({
    where: { profileId: auth.id },
  });
  const items: ClothingItem[] = rows.map((row) => ({
    id: row.id,
    category: categoryFromDb(row.category),
    name: row.name,
    dominantColor: row.dominantColor,
    createdAt: row.createdAt.toISOString(),
  }));

  const { promptCombos, alreadySeen } = await loadSeenOutfits(
    auth.id,
    cleanExcludeCombos(excludeCombos),
    new Set(items.map((item) => item.id)),
  );

  try {
    const outfits = await generateAiOutfits({
      items,
      style,
      includeOuterwear,
      includeShoes,
      weather: weather ?? null,
      season: season ?? null,
      excludeCombos: promptCombos,
      alreadySeen,
    });
    await recordSuggestions(auth.id, outfits);
    return NextResponse.json({ outfits });
  } catch (error) {
    const message =
      error instanceof OutfitGenerationError
        ? error.message
        : "Outfit generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
