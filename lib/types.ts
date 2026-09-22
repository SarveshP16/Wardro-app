/// Shared domain types — mirrors the Dart models in the original Flutter
/// app (ClothingItem, SavedOutfit, GeneratedOutfit, OutfitStyle,
/// WeatherSnapshot). Kept framework-agnostic so both server (API routes)
/// and client components can import from here.

export type ClothingCategory = "top" | "bottom" | "outerwear" | "shoes";

export const CLOTHING_CATEGORIES: ClothingCategory[] = [
  "top",
  "bottom",
  "outerwear",
  "shoes",
];

export interface ClothingItem {
  id: string;
  category: ClothingCategory;
  name: string | null;
  /// Packed 0xRRGGBB average color of the cutout's opaque pixels, or null
  /// for items saved before this existed. See lib/dominantColor.ts.
  dominantColor: number | null;
  createdAt: string;
}

export type OutfitStyle = "casual" | "smart_casual" | "formal" | "evening";

export const OUTFIT_STYLES: OutfitStyle[] = [
  "casual",
  "smart_casual",
  "formal",
  "evening",
];

/// One outfit combination proposed by a single generation call. Ephemeral
/// — not persisted unless the user saves it (see SavedOutfit).
export interface GeneratedOutfit {
  title: string;
  rationale: string;
  itemIds: string[];
}

/// A GeneratedOutfit the user chose to keep.
export interface SavedOutfit {
  id: string;
  style: OutfitStyle;
  title: string;
  rationale: string;
  itemIds: string[];
  createdAt: string;
}

export interface WeatherSnapshot {
  temperatureCelsius: number;
  /// Broad icon bucket, e.g. "Clear" | "Clouds" | "Rain" | "Snow" | "Fog"
  /// | "Drizzle" | "Thunderstorm".
  condition: string;
  /// Short human description, e.g. "light rain".
  description: string;
  locationLabel: string;
}

export class OutfitGenerationError extends Error {}
export class WeatherError extends Error {}
export class BackgroundRemovalError extends Error {}
