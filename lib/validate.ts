import sharp from "sharp";

import { sortCategories } from "./categories";
import {
  CLOTHING_CATEGORIES,
  GENDERS,
  OUTFIT_STYLES,
  SEASONS,
  type ClothingCategory,
  type Gender,
  type OutfitStyle,
  type Season,
} from "./types";

/// Server-side request validation shared by the API routes, so bad input
/// gets a clear 400 instead of surfacing as a database error.

export const MAX_ITEM_NAME_LENGTH = 80;

/// Largest raw photo accepted for background removal. Phone cameras
/// produce ~3-12 MB JPEGs; anything far beyond that isn't a photo.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/// Most recent outfit combinations sent back to the AI Stylist as "don't
/// repeat these" -- keeps the prompt bounded in a long session.
export const MAX_EXCLUDED_COMBOS = 200;

export function isCategory(value: unknown): value is ClothingCategory {
  return CLOTHING_CATEGORIES.includes(value as ClothingCategory);
}

/// One or more known categories, deduplicated into canonical order --
/// or null if the value isn't a usable list.
export function cleanCategories(value: unknown): ClothingCategory[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!value.every(isCategory)) return null;
  return sortCategories(value);
}

export function isGender(value: unknown): value is Gender {
  return GENDERS.includes(value as Gender);
}

export function isStyle(value: unknown): value is OutfitStyle {
  return OUTFIT_STYLES.includes(value as OutfitStyle);
}

export function isSeason(value: unknown): value is Season {
  return SEASONS.includes(value as Season);
}

/// Trims an optional item name; null when empty. Returns undefined if
/// it's too long (or not a string).
export function cleanItemName(
  name: unknown,
): string | null | undefined {
  if (name === null || typeof name === "undefined") return null;
  if (typeof name !== "string") return undefined;
  const trimmed = name.trim();
  if (trimmed.length > MAX_ITEM_NAME_LENGTH) return undefined;
  return trimmed || null;
}

/// Decodes a base64 cutout and confirms it really is a PNG image (the
/// image store writes it to disk as `<id>.png` and serves it back).
export async function decodePngCutout(base64: unknown): Promise<Buffer | null> {
  if (typeof base64 !== "string" || base64.length === 0) return null;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_UPLOAD_BYTES) return null;
  try {
    const { format } = await sharp(bytes).metadata();
    return format === "png" ? bytes : null;
  } catch {
    return null;
  }
}

/// Keeps only well-formed `string[][]` combos, newest last, capped.
export function cleanExcludeCombos(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (combo): combo is string[] =>
        Array.isArray(combo) && combo.every((id) => typeof id === "string"),
    )
    .slice(-MAX_EXCLUDED_COMBOS);
}
