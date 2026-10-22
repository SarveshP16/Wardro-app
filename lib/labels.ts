import type { ClothingCategory, Gender, OutfitStyle, Season } from "./types";

/// Display labels for categories, occasion styles, seasons and genders.
export const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  top: "Top",
  bottom: "Bottom",
  skirt: "Skirt",
  dress: "Dress",
  jumpsuit: "Jumpsuit",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

export const CATEGORY_PLURALS: Record<ClothingCategory, string> = {
  top: "Tops",
  bottom: "Bottoms",
  skirt: "Skirts",
  dress: "Dresses",
  jumpsuit: "Jumpsuits",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

export const STYLE_LABELS: Record<OutfitStyle, string> = {
  casual: "Casual",
  smart_casual: "Smart casual",
  work: "Work",
  interview: "Interview",
  formal: "Formal",
  evening: "Evening",
  date_night: "Date night",
  party: "Party",
  wedding_guest: "Wedding guest",
  active: "Active",
  travel: "Travel",
  beach: "Beach",
  lounge: "Lounge",
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

export const GENDER_LABELS: Record<Gender, string> = {
  all: "Show all",
  women: "Women",
  men: "Men",
};

/// The Prisma enums store the same names in SCREAMING_CASE
/// (`date_night` <-> `DATE_NIGHT`).
type DbCategory = Uppercase<ClothingCategory>;
type DbStyle = Uppercase<OutfitStyle>;
type DbSeason = Uppercase<Season>;

export function categoryToDb(category: ClothingCategory): DbCategory {
  return category.toUpperCase() as DbCategory;
}

export function categoryFromDb(category: DbCategory): ClothingCategory {
  return category.toLowerCase() as ClothingCategory;
}

export function styleToDb(style: OutfitStyle): DbStyle {
  return style.toUpperCase() as DbStyle;
}

export function styleFromDb(style: DbStyle): OutfitStyle {
  return style.toLowerCase() as OutfitStyle;
}

export function seasonToDb(season: Season): DbSeason {
  return season.toUpperCase() as DbSeason;
}

export function seasonFromDb(season: DbSeason | null): Season | null {
  return season ? (season.toLowerCase() as Season) : null;
}
