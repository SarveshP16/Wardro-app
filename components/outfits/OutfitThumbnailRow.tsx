import { ItemImage } from "@/components/ItemImage";
import type { ClothingItem } from "@/lib/types";

/// Port of `outfit_thumbnail_row.dart` — the small overlapping row of
/// item cutouts shown on each outfit card.
export function OutfitThumbnailRow({
  itemIds,
  itemsById,
}: {
  itemIds: string[];
  itemsById: Map<string, ClothingItem>;
}) {
  return (
    <div className="flex -space-x-3">
      {itemIds.map((id) => {
        const item = itemsById.get(id);
        return (
          <ItemImage
            key={id}
            id={id}
            alt={item?.name ?? item?.category ?? "Wardrobe item"}
            className="h-16 w-16 shrink-0 rounded-full border-2 border-surface"
          />
        );
      })}
    </div>
  );
}
