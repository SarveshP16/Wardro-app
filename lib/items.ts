import { sortCategories } from "./categories";
import { categoryFromDb } from "./labels";
import type { ClothingItem, PaletteColor } from "./types";

/// A stored palette, if it has the expected shape.
function parsePalette(value: unknown): PaletteColor[] | null {
  if (!Array.isArray(value)) return null;
  const colors = value.filter(
    (entry): entry is PaletteColor =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as PaletteColor).color === "number" &&
      typeof (entry as PaletteColor).weight === "number",
  );
  return colors.length > 0 ? colors : null;
}

/// Server-side: a ClothingItem database row as the API returns it.
export function itemFromRow(row: {
  id: string;
  categories: Parameters<typeof categoryFromDb>[0][];
  name: string | null;
  dominantColor: number | null;
  palette?: unknown;
  createdAt: Date;
}): ClothingItem {
  return {
    id: row.id,
    categories: sortCategories(row.categories.map(categoryFromDb)),
    name: row.name,
    dominantColor: row.dominantColor,
    palette: parsePalette(row.palette),
    createdAt: row.createdAt.toISOString(),
  };
}
