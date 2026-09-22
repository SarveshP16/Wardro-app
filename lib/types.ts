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

/// Optional season filter for outfit generation -- the AI Stylist factors
/// it into fabric/layering/color choices (see lib/anthropic.ts); Quick
/// Match ignores it, same as it already ignores `style`.
export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

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
  season: Season | null;
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

/// One day of a multi-day forecast (see lib/weather.ts's
/// fetchTripForecastFor*, used by Packing List mode). Same shape as
/// WeatherSnapshot minus `locationLabel` (shared across every day of a
/// trip, so it's carried alongside the array rather than per-day) plus
/// the date it's for.
export interface DailyForecast {
  /// YYYY-MM-DD.
  date: string;
  /// Midpoint of that day's forecast high/low.
  temperatureCelsius: number;
  condition: string;
  description: string;
}

/// One day of a Packing List trip, as sent to generateAiPackingList --
/// `weather` is null when the date falls beyond the forecast horizon (see
/// MAX_FORECAST_DAYS_AHEAD in lib/weather.ts) or the user left live
/// weather off, in which case the season filter is used as a fallback.
export interface PackingDayInput {
  date: string;
  weather: DailyForecast | null;
}

/// One day of a generated Packing List trip.
export interface PackingDayOutfit {
  date: string;
  outfit: GeneratedOutfit;
  weather: DailyForecast | null;
}

export class OutfitGenerationError extends Error {}
export class WeatherError extends Error {}
export class BackgroundRemovalError extends Error {}
