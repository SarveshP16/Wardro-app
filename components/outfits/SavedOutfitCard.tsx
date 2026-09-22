import { Trash2 } from "lucide-react";

import { SEASON_LABELS, STYLE_LABELS } from "@/lib/labels";
import { SEASON_ICONS } from "@/lib/seasonIcons";
import type { ClothingItem, SavedOutfit } from "@/lib/types";

import { OutfitThumbnailRow } from "./OutfitThumbnailRow";

/// Port of `saved_outfit_card.dart`.
export function SavedOutfitCard({
  outfit,
  itemsById,
  onDelete,
}: {
  outfit: SavedOutfit;
  itemsById: Map<string, ClothingItem>;
  onDelete: () => void;
}) {
  const SeasonIcon = outfit.season ? SEASON_ICONS[outfit.season] : null;
  return (
    <div className="rounded-2xl border border-outline bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
          <span>{STYLE_LABELS[outfit.style]}</span>
          {outfit.season && SeasonIcon ? (
            <span className="flex items-center gap-1 text-foreground/50">
              <SeasonIcon size={12} />
              {SEASON_LABELS[outfit.season]}
            </span>
          ) : null}
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete saved outfit"
          className="text-foreground/40 transition-colors hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="mt-2">
        <OutfitThumbnailRow itemIds={outfit.itemIds} itemsById={itemsById} />
      </div>
      <h3 className="mt-3 font-serif text-base font-semibold">
        {outfit.title}
      </h3>
      <p className="mt-1 text-sm text-foreground/65">{outfit.rationale}</p>
    </div>
  );
}
