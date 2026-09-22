import type { ClothingCategory, OutfitStyle } from "./types";

/// Display labels — mirrors ClothingCategoryX.label / OutfitStyleX.label
/// in the original Dart code.
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

/// Category accent colors (light/dark), ported from AppColors —
/// terracotta / slate blue / ochre / sage.
export const CATEGORY_COLORS: Record<
  ClothingCategory,
  { light: string; dark: string }
> = {
  top: { light: "#B2532D", dark: "#D97B52" },
  bottom: { light: "#4C5B72", dark: "#7488A6" },
  outerwear: { light: "#B8862B", dark: "#D4A63D" },
  shoes: { light: "#5B6B4F", dark: "#7C8F6C" },
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
