"use client";

import { useLook } from "@/app/look-context";
import type { ClothingItem } from "@/lib/types";

import { ClothingItemCard } from "./ClothingItemCard";

/// Tile grid -- tight gutters in Colour story (a catalogue page),
/// slightly looser, rounded tiles in Tailor's navy.
export function WardrobeGrid({ items }: { items: ClothingItem[] }) {
  const look = useLook();
  return (
    <div
      className={`grid grid-cols-3 px-5 sm:grid-cols-4 lg:grid-cols-5 ${
        look === "colour" ? "gap-[3px]" : "gap-1.5"
      }`}
    >
      {items.map((item) => (
        <ClothingItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
