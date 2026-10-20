import type { ClothingCategory, OutfitStyle, Season } from "./types";

/// Display labels for categories, occasion styles, and seasons.
export const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

export const STYLE_LABELS: Record<OutfitStyle, string> = {
  casual: "Casual",
  smart_casual: "Smart Casual",
  formal: "Formal",
  evening: "Evening",
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

/// Maps a ClothingCategory <-> the Prisma `Category` enum's SCREAMING_CASE
/// storage key.
export function categoryToDb(
  category: ClothingCategory,
): "TOP" | "BOTTOM" | "OUTERWEAR" | "SHOES" {
  return category.toUpperCase() as "TOP" | "BOTTOM" | "OUTERWEAR" | "SHOES";
}

export function categoryFromDb(
  category: "TOP" | "BOTTOM" | "OUTERWEAR" | "SHOES",
): ClothingCategory {
  return category.toLowerCase() as ClothingCategory;
}

/// Maps an OutfitStyle <-> the Prisma `Style` enum's SCREAMING_CASE
/// storage key.
export function styleToDb(
  style: OutfitStyle,
): "CASUAL" | "SMART_CASUAL" | "FORMAL" | "EVENING" {
  return style.toUpperCase() as
    | "CASUAL"
    | "SMART_CASUAL"
    | "FORMAL"
    | "EVENING";
}

export function styleFromDb(
  style: "CASUAL" | "SMART_CASUAL" | "FORMAL" | "EVENING",
): OutfitStyle {
  return style.toLowerCase() as OutfitStyle;
}

/// Maps a Season <-> the Prisma `Season` enum's SCREAMING_CASE storage key.
export function seasonToDb(
  season: Season,
): "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" {
  return season.toUpperCase() as "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
}

export function seasonFromDb(
  season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" | null,
): Season | null {
  return season ? (season.toLowerCase() as Season) : null;
}
