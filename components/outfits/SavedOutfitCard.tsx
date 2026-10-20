"use client";

import { Trash2 } from "lucide-react";

import { SEASON_LABELS, STYLE_LABELS } from "@/lib/labels";
import { SEASON_ICONS } from "@/lib/seasonIcons";
import type { ClothingItem, SavedOutfit } from "@/lib/types";

import { OutfitVisual } from "./OutfitVisual";

/// A saved outfit: its occasion (and season, if it was saved with one),
/// the outfit picture, title, rationale, and a delete action.
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
    <article className="flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[13px] text-muted">
          <span className="font-semibold text-ink">
            {STYLE_LABELS[outfit.style]}
          </span>
          {outfit.season && SeasonIcon ? (
            <span className="flex items-center gap-1">
              <SeasonIcon size={13} />
              {SEASON_LABELS[outfit.season]}
            </span>
          ) : null}
        </div>
        <button
          onClick={onDelete}
          aria-label={`Delete ${outfit.title}`}
          className="-mr-2 rounded-control p-2 text-muted transition-colors hover:bg-surface-2 hover:text-danger"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <OutfitVisual itemIds={outfit.itemIds} itemsById={itemsById} />
      <h3 className="display mt-4 text-[17px] leading-snug">{outfit.title}</h3>
      <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-muted">
        {outfit.rationale}
      </p>
    </article>
  );
}
