"use client";

import { ItemImage } from "@/components/ItemImage";
import { primaryCategory } from "@/lib/categories";
import { CATEGORY_LABELS } from "@/lib/labels";
import { outfitSignature } from "@/lib/outfitSignature";
import type { ClothingItem, GeneratedOutfit, PackingDayOutfit } from "@/lib/types";

import { OutfitResultCard } from "./OutfitResultCard";

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

type WornOutfit = { outfit: GeneratedOutfit; days: PackingDayOutfit[] };

/// A generated Packing List: what to pack (every piece once), then each
/// outfit once with the days it's worn -- a trip can have fewer outfits
/// than days, re-worn.
export function PackingPlan({
  days,
  itemsById,
  savedSignatures,
  onSave,
}: {
  days: PackingDayOutfit[];
  itemsById: Map<string, ClothingItem>;
  savedSignatures: Set<string>;
  onSave: (outfit: GeneratedOutfit) => void;
}) {
  // Group days by outfit, in order of first wear.
  const outfits: WornOutfit[] = [];
  const bySignature = new Map<string, WornOutfit>();
  for (const day of days) {
    const signature = outfitSignature(day.outfit.itemIds);
    const existing = bySignature.get(signature);
    if (existing) {
      existing.days.push(day);
    } else {
      const entry = { outfit: day.outfit, days: [day] };
      bySignature.set(signature, entry);
      outfits.push(entry);
    }
  }
  const pieces = [...new Set(days.flatMap((d) => d.outfit.itemIds))];

  return (
    <div className="flex flex-col">
      <section aria-label="What to pack" className="px-5 pt-6">
        <h3 className="display text-[15px]">
          Pack {pieces.length} piece{pieces.length === 1 ? "" : "s"}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          {outfits.length} outfit{outfits.length === 1 ? "" : "s"} for{" "}
          {days.length} day{days.length === 1 ? "" : "s"}
          {outfits.length < days.length ? ", some worn more than once" : ""}
        </p>
        <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-8">
          {pieces.map((id) => {
            const item = itemsById.get(id);
            return (
              <ItemImage
                key={id}
                id={id}
                alt={item?.name ?? (item ? CATEGORY_LABELS[primaryCategory(item)] : "Item")}
                padding="p-1.5"
                className="aspect-square rounded-tile"
              />
            );
          })}
        </div>
      </section>

      <div className="grid gap-x-8 gap-y-10 px-5 pt-8 md:grid-cols-2">
        {outfits.map(({ outfit, days: worn }) => {
          // Coolest low to warmest high over the days it's worn; "~" when
          // any of them is typical weather rather than a forecast.
          const weather = worn.flatMap((d) => (d.weather ? [d.weather] : []));
          const tempText =
            weather.length === 0
              ? null
              : `${weather.some((w) => w.source === "typical") ? "~" : ""}${Math.round(
                  Math.min(...weather.map((w) => w.lowCelsius)),
                )}–${Math.round(Math.max(...weather.map((w) => w.highCelsius)))}°C`;
          return (
            <OutfitResultCard
              key={outfitSignature(outfit.itemIds)}
              outfit={outfit}
              itemsById={itemsById}
              saved={savedSignatures.has(outfitSignature(outfit.itemIds))}
              onSave={() => onSave(outfit)}
              eyebrow={
                <div className="flex items-baseline justify-between gap-3">
                  <span className="display text-[14px] leading-snug">
                    {worn.map((d) => formatDay(d.date)).join(", ")}
                  </span>
                  {tempText ? (
                    <span className="shrink-0 text-xs text-muted">{tempText}</span>
                  ) : null}
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
