"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import type { ClothingItem, GeneratedOutfit } from "@/lib/types";

import { OutfitVisual } from "./OutfitVisual";

/// One freshly generated combination: the outfit picture, its title and
/// rationale, and a Save action. `eyebrow` is an optional line above the
/// picture (Packing List uses it for the day and its forecast).
export function OutfitResultCard({
  outfit,
  itemsById,
  saved,
  onSave,
  eyebrow,
}: {
  outfit: GeneratedOutfit;
  itemsById: Map<string, ClothingItem>;
  saved: boolean;
  onSave: () => void;
  eyebrow?: ReactNode;
}) {
  return (
    <article className="flex flex-col">
      {eyebrow ? <div className="mb-2">{eyebrow}</div> : null}
      <OutfitVisual itemIds={outfit.itemIds} itemsById={itemsById} />
      <h3 className="display mt-4 text-[17px] leading-snug">{outfit.title}</h3>
      <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-muted">
        {outfit.rationale}
      </p>
      <Button
        variant={saved ? "secondary" : "primary"}
        onClick={onSave}
        disabled={saved}
        icon={saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        className="mt-4 self-start"
      >
        {saved ? "Saved" : "Save outfit"}
      </Button>
    </article>
  );
}
