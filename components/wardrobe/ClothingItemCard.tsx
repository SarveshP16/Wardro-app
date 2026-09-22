import Link from "next/link";

import { ItemImage } from "@/components/ItemImage";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { toHex } from "@/lib/color";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { ClothingItem } from "@/lib/types";

/// Port of `clothing_item_card.dart`.
export function ClothingItemCard({ item }: { item: ClothingItem }) {
  const Icon = CATEGORY_ICONS[item.category];
  return (
    <Link
      href={`/wardrobe/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-outline bg-surface transition-shadow hover:shadow-md"
    >
      <ItemImage
        id={item.id}
        alt={item.name ?? CATEGORY_LABELS[item.category]}
        className="aspect-square"
      />
      <div className="flex items-center gap-1.5 px-3 py-2">
        <Icon size={14} className="shrink-0 text-foreground/50" />
        <span className="truncate text-sm font-medium">
          {item.name ?? CATEGORY_LABELS[item.category]}
        </span>
        {item.dominantColor !== null ? (
          <span
            className="ml-auto h-3 w-3 shrink-0 rounded-full border border-outline"
            style={{ backgroundColor: toHex(item.dominantColor) }}
          />
        ) : null}
      </div>
    </Link>
  );
}
