"use client";

import Link from "next/link";

import { useLook } from "@/app/look-context";
import { ItemImage } from "@/components/ItemImage";
import { toHex } from "@/lib/color";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { ClothingItem } from "@/lib/types";

/// One wardrobe tile. No caption -- the garment is the label; its name
/// and details live on the item page. The dominant colour shows as a dot
/// (Tailor's navy) or a band along the bottom edge (Colour story).
export function ClothingItemCard({ item }: { item: ClothingItem }) {
  const look = useLook();
  const label = item.name ?? CATEGORY_LABELS[item.category];
  const color = item.dominantColor !== null ? toHex(item.dominantColor) : null;

  return (
    <Link
      href={`/wardrobe/${item.id}`}
      title={label}
      className="group relative block overflow-hidden rounded-tile"
    >
      <ItemImage
        id={item.id}
        alt={label}
        padding={look === "colour" ? "px-2 pt-2.5 pb-4" : "p-2.5"}
        className={`transition-opacity group-hover:opacity-90 ${
          look === "colour" ? "aspect-[3/4]" : "aspect-square"
        }`}
      />
      {color ? (
        look === "colour" ? (
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1.5"
            style={{ backgroundColor: color }}
          />
        ) : (
          <span
            aria-hidden
            className="absolute bottom-2 left-2 h-2.5 w-2.5 rounded-full ring-[1.5px] ring-white/80"
            style={{ backgroundColor: color }}
          />
        )
      ) : null}
    </Link>
  );
}
