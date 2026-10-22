import { sortCategories } from "./categories";
import { categoryFromDb } from "./labels";
import type { ClothingItem } from "./types";

/// Server-side: a ClothingItem database row as the API returns it.
export function itemFromRow(row: {
  id: string;
  categories: Parameters<typeof categoryFromDb>[0][];
  name: string | null;
  dominantColor: number | null;
  createdAt: Date;
}): ClothingItem {
  return {
    id: row.id,
    categories: sortCategories(row.categories.map(categoryFromDb)),
    name: row.name,
    dominantColor: row.dominantColor,
    createdAt: row.createdAt.toISOString(),
  };
}
