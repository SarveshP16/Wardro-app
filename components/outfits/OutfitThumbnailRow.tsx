import { ItemImage } from "@/components/ItemImage";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { ClothingItem } from "@/lib/types";

/// The garment images on each outfit card — a 2-column grid of large
/// squares (rather than a row of small overlapping circles) so the
/// pieces are actually recognizable at a glance.
export function OutfitThumbnailRow({
  itemIds,
  itemsById,
}: {
  itemIds: string[];
  itemsById: Map<string, ClothingItem>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {itemIds.map((id) => {
        const item = itemsById.get(id);
        const label = item?.name ?? (item ? CATEGORY_LABELS[item.category] : "Item");
        return (
          <ItemImage
            key={id}
            id={id}
            alt={label}
            className="aspect-square w-full rounded-xl border border-outline"
          />
        );
      })}
    </div>
  );
}
