/// Shared domain types. Kept framework-agnostic so both server (API
/// routes) and client components can import from here.

/// Avatar colors a profile can pick -- stored on Profile.color by key so
/// the palette can be retuned without a migration.
export type ProfileColor = "navy" | "clay" | "teal" | "mustard" | "plum" | "sage";

export const PROFILE_COLORS: Record<ProfileColor, string> = {
  navy: "#22395c",
  clay: "#c4643f",
  teal: "#2f7d74",
  mustard: "#b98c22",
  plum: "#7a4a6e",
  sage: "#62785c",
};

/// Longest allowed profile name (enforced server-side in lib/profile.ts).
export const MAX_PROFILE_NAME_LENGTH = 24;

export type ThemeMode = "system" | "light" | "dark";

export const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];

/// Wardro's two visual styles, picked per profile in Settings (see the
/// `[data-look]` token blocks in app/globals.css):
/// - navy: "Tailor's navy" -- navy palette, expanded label-style type,
///   outfits shown as a stylist's flat-lay.
/// - colour: "Colour story" -- neutral gallery chrome where the clothes'
///   own colours carry the design: spectrum strip, colour bands.
export type Look = "navy" | "colour";

export const LOOKS: Look[] = ["navy", "colour"];

/// A person using Wardro, picked by name on the profile screen. Each has
/// their own wardrobe, saved outfits, and theme.
export interface Profile {
  id: string;
  name: string;
  color: ProfileColor;
  themeMode: ThemeMode;
  look: Look;
  gender: Gender;
}

export type ClothingCategory =
  | "top"
  | "bottom"
  | "skirt"
  | "dress"
  | "jumpsuit"
  | "outerwear"
  | "shoes";

/// Canonical order -- tabs, pickers, and each piece's `categories` list
/// (whose first entry is its main category) all follow it.
export const CLOTHING_CATEGORIES: ClothingCategory[] = [
  "top",
  "bottom",
  "skirt",
  "dress",
  "jumpsuit",
  "outerwear",
  "shoes",
];

/// Which categories a profile is offered: men's profiles don't see
/// dresses, skirts and jumpsuits (see lib/categories.ts).
export type Gender = "all" | "women" | "men";

export const GENDERS: Gender[] = ["all", "women", "men"];

/// One of a piece's main colours (see lib/palette.ts).
export interface PaletteColor {
  /// Packed 0xRRGGBB.
  color: number;
  /// Share of the piece, 0..1; a palette's weights sum to ~1.
  weight: number;
}

export interface ClothingItem {
  id: string;
  /// One or more, in canonical order (CLOTHING_CATEGORIES); the first is
  /// the main one -- see lib/categories.ts's primaryCategory.
  categories: ClothingCategory[];
  name: string | null;
  /// Packed 0xRRGGBB average color of the cutout's opaque pixels, or null
  /// for items saved before this existed. See lib/dominantColor.ts.
  dominantColor: number | null;
  /// Up to 3 main colours, heaviest first -- null until computed (see
  /// lib/palette.ts). Prints keep their colours here, unlike the average.
  palette: PaletteColor[] | null;
  createdAt: string;
}

export type OutfitStyle =
  | "casual"
  | "smart_casual"
  | "work"
  | "interview"
  | "formal"
  | "evening"
  | "date_night"
  | "party"
  | "wedding_guest"
  | "active"
  | "travel"
  | "beach"
  | "lounge";

export const OUTFIT_STYLES: OutfitStyle[] = [
  "casual",
  "smart_casual",
  "work",
  "interview",
  "formal",
  "evening",
  "date_night",
  "party",
  "wedding_guest",
  "active",
  "travel",
  "beach",
  "lounge",
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
