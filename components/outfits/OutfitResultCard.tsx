import { Button } from "@/components/ui/Button";
import type { ClothingItem, GeneratedOutfit } from "@/lib/types";

import { OutfitThumbnailRow } from "./OutfitThumbnailRow";

/// Port of `outfit_result_card.dart` — one freshly generated combination,
/// with a Save action.
export function OutfitResultCard({
  outfit,
  itemsById,
  saved,
  onSave,
}: {
  outfit: GeneratedOutfit;
  itemsById: Map<string, ClothingItem>;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="rounded-2xl border border-outline bg-surface p-4">
      <OutfitThumbnailRow itemIds={outfit.itemIds} itemsById={itemsById} />
      <h3 className="mt-3 font-serif text-base font-semibold">
        {outfit.title}
      </h3>
      <p className="mt-1 text-sm text-foreground/65">{outfit.rationale}</p>
      <Button
        variant={saved ? "outlined" : "filled"}
        onClick={onSave}
        disabled={saved}
        className="mt-3 w-full"
      >
        {saved ? "Saved" : "Save outfit"}
      </Button>
    </div>
  );
}
