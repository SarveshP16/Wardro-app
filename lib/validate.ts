import sharp from "sharp";

import { sortCategories } from "./categories";
import {
  CLOTHING_CATEGORIES,
  GENDERS,
  OUTFIT_STYLES,
  SEASONS,
  type ClothingCategory,
  type DailyForecast,
  type Gender,
  type OutfitStyle,
  type PackingDayInput,
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/// A plausible air temperature in °C, or null.
function cleanCelsius(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > -90 && value < 60
    ? value
    : null;
}

/// A trip day's weather as sent by the client (lib/weather.ts); null when
/// it's missing or malformed, so that day falls back to the season. It
/// goes into the AI Stylist's prompt, hence the short, plain strings.
function cleanDailyForecast(value: unknown, date: string): DailyForecast | null {
  if (typeof value !== "object" || value === null) return null;
  const w = value as Record<string, unknown>;
  const high = cleanCelsius(w.highCelsius);
  const low = cleanCelsius(w.lowCelsius);
  const temperature = cleanCelsius(w.temperatureCelsius);
  if (high === null || low === null || temperature === null) return null;
  const text = (v: unknown) =>
    typeof v === "string" ? v.replace(/[^\w ,'-]/g, "").slice(0, 40) : "";
  return {
    date,
    temperatureCelsius: temperature,
    highCelsius: high,
    lowCelsius: low,
    condition: text(w.condition),
    description: text(w.description),
    source: w.source === "typical" ? "typical" : "forecast",
  };
}

/// The trip's days, in order, or null if the list itself is unusable.
export function cleanPackingDays(value: unknown): PackingDayInput[] | null {
  if (!Array.isArray(value)) return null;
  const days: PackingDayInput[] = [];
  for (const day of value) {
    const date = (day as { date?: unknown } | null)?.date;
    if (typeof date !== "string" || !ISO_DATE.test(date)) return null;
    days.push({ date, weather: cleanDailyForecast((day as { weather?: unknown }).weather, date) });
  }
  return days;
}
