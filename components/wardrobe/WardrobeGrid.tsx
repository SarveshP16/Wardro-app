import type { ClothingItem } from "@/lib/types";

import { ClothingItemCard } from "./ClothingItemCard";

/// Port of `wardrobe_grid.dart`.
export function WardrobeGrid({ items }: { items: ClothingItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-5 pb-8 pt-3 sm:grid-cols-3">
      {items.map((item) => (
        <ClothingItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
