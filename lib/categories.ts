import { CLOTHING_CATEGORIES } from "./types";
import type { ClothingCategory, ClothingItem, Gender } from "./types";

/// Rules for how wardrobe categories combine into outfits, shared by Quick
/// Match, the AI Stylist and the outfit pictures.
///
/// Every category fills one *role* in an outfit. An outfit is either a
/// top + a bottom, or a one-piece (dress, jumpsuit) on its own -- plus,
/// optionally, outerwear and shoes. A piece can have several categories
/// (an overshirt as top *and* outerwear), so it can fill any of their
/// roles, but only one at a time.
export type OutfitRole = "top" | "bottom" | "onepiece" | "outerwear" | "shoes";

export const ROLE_OF: Record<ClothingCategory, OutfitRole> = {
  top: "top",
  bottom: "bottom",
  skirt: "bottom",
  dress: "onepiece",
  jumpsuit: "onepiece",
  outerwear: "outerwear",
  shoes: "shoes",
};

/// Hidden from profiles set to "men" (Settings → Clothing).
const WOMENS_CATEGORIES: ReadonlySet<ClothingCategory> = new Set([
  "skirt",
  "dress",
  "jumpsuit",
]);

/// The categories a profile is offered when picking a piece's categories.
export function categoriesFor(gender: Gender): ClothingCategory[] {
  return gender === "men"
    ? CLOTHING_CATEGORIES.filter((c) => !WOMENS_CATEGORIES.has(c))
    : CLOTHING_CATEGORIES;
}

/// Deduplicated, in canonical order -- how `categories` is always stored.
export function sortCategories(
  categories: Iterable<ClothingCategory>,
): ClothingCategory[] {
  const set = new Set(categories);
  return CLOTHING_CATEGORIES.filter((c) => set.has(c));
}

/// A piece's main category: its icon and default name.
export function primaryCategory(item: ClothingItem): ClothingCategory {
  return item.categories[0] ?? "top";
}

/// The roles a piece can fill, in the order of its categories.
export function rolesOf(item: ClothingItem): OutfitRole[] {
  return [...new Set(item.categories.map((c) => ROLE_OF[c]))];
}

/// A one-piece replaces the top and bottom, so they can't share an outfit.
function conflicts(role: OutfitRole, taken: Set<OutfitRole>): boolean {
  if (role === "onepiece") return taken.has("top") || taken.has("bottom");
  if (role === "top" || role === "bottom") return taken.has("onepiece");
  return false;
}

/// Decides which role each piece of an outfit plays (for the flat-lay and
/// lineup pictures): pieces with fewer options choose first, each taking
/// its first role that's still free and fits with the others (a jacket
/// that's also a top goes over a dress as outerwear). Returns null for a
/// piece whose roles are all taken (e.g. two tops).
export function assignRoles(
  items: ClothingItem[],
): Map<string, OutfitRole | null> {
  const taken = new Set<OutfitRole>();
  const result = new Map<string, OutfitRole | null>();
  const byChoice = [...items].sort(
    (a, b) => rolesOf(a).length - rolesOf(b).length,
  );
  for (const item of byChoice) {
    const free = rolesOf(item).filter((r) => !taken.has(r));
    const role = free.find((r) => !conflicts(r, taken)) ?? free[0] ?? null;
    if (role) taken.add(role);
    result.set(item.id, role);
  }
  return result;
}
