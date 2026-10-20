"use client";

import type { ClothingItem, PackingDayOutfit } from "@/lib/types";

import { OutfitResultCard } from "./OutfitResultCard";

function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/// One day of a generated Packing List trip -- an OutfitResultCard headed
/// by the date and that day's forecast, if any.
export function PackingDayCard({
  day,
  itemsById,
  saved,
  onSave,
}: {
  day: PackingDayOutfit;
  itemsById: Map<string, ClothingItem>;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <OutfitResultCard
      outfit={day.outfit}
      itemsById={itemsById}
      saved={saved}
      onSave={onSave}
      eyebrow={
        <div className="flex items-baseline justify-between gap-3">
          <span className="display text-[15px]">{formatDayLabel(day.date)}</span>
          {day.weather ? (
            <span className="text-xs text-muted">
              {Math.round(day.weather.temperatureCelsius)}°C,{" "}
              {day.weather.description}
            </span>
          ) : null}
        </div>
      }
    />
  );
}
