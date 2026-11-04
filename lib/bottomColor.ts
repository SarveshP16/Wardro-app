import { rolesOf, ROLE_OF } from "./categories";
import { colorName, compareByColor } from "./colorNames";
import { OutfitGenerationError } from "./types";
import type { ClothingItem } from "./types";

/// "Build outfits around my navy trousers": a filter shared by Quick Match
/// (applied in the browser) and the AI Stylist (applied on the server).
/// Colours are the coarse clothing names from lib/colorNames.ts ("navy",
/// "stone"), so a few shades of one colour count as one choice.

export interface BottomColorOption {
  /// colorName() of the bottoms in this group, e.g. "navy".
  name: string;
  /// A representative colour for the chip's swatch.
  swatch: number;
  /// How many bottoms have it.
  count: number;
}

/// A piece's main colour: the largest share of its palette, or its
/// average colour for pieces saved before palettes existed.
function mainColor(item: ClothingItem): number | null {
  return item.palette?.[0]?.color ?? item.dominantColor;
}

/// The colour name of a piece that can be worn as a bottom, else null.
function bottomColorOf(item: ClothingItem): string | null {
  if (!rolesOf(item).includes("bottom")) return null;
  const color = mainColor(item);
  return color === null ? null : colorName(color);
}

/// The colours of the wardrobe's bottoms (trousers, jeans, shorts,
/// skirts), as a spectrum.
export function bottomColorOptions(items: ClothingItem[]): BottomColorOption[] {
  const byName = new Map<string, BottomColorOption>();
  for (const item of items) {
    const name = bottomColorOf(item);
    if (name === null) continue;
    const option = byName.get(name);
    if (option) option.count++;
    else byName.set(name, { name, swatch: mainColor(item)!, count: 1 });
  }
  return [...byName.values()].sort((a, b) => compareByColor(a.swatch, b.swatch));
}

/// The wardrobe narrowed so every outfit has a bottom of `name`: other
/// bottoms can no longer be worn as one, and dresses and jumpsuits drop
/// out, since they replace the bottom. A piece keeps its other categories
/// (a top that is also a bottom stays on offer as a top). Throws when the
/// wardrobe has no bottoms of that colour.
export function restrictToBottomColor(
  items: ClothingItem[],
  name: string,
): ClothingItem[] {
  const restricted = items
    .map((item) => {
      const keepBottom = bottomColorOf(item) === name;
      return {
        ...item,
        categories: item.categories.filter((c) => {
          const role = ROLE_OF[c];
          if (role === "onepiece") return false;
          return role !== "bottom" || keepBottom;
        }),
      };
    })
    .filter((item) => item.categories.length > 0);

  if (!restricted.some((item) => rolesOf(item).includes("bottom"))) {
    throw new OutfitGenerationError(`There are no ${name} bottoms in your wardrobe.`);
  }
  return restricted;
}
