import { Button } from "@/components/ui/Button";
import type { ClothingItem, PackingDayOutfit } from "@/lib/types";

import { OutfitThumbnailRow } from "./OutfitThumbnailRow";

function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/// One day of a generated Packing List trip -- like OutfitResultCard, but
/// headed by the date (and that day's forecast, if any) instead of being
/// one of several undated alternatives.
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
    <div className="rounded-2xl border border-outline bg-surface p-4">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-accent">
        <span>{formatDayLabel(day.date)}</span>
        {day.weather ? (
          <span className="normal-case text-foreground/50">
            {Math.round(day.weather.temperatureCelsius)}°C, {day.weather.description}
          </span>
        ) : null}
      </div>
      <div className="mt-2">
        <OutfitThumbnailRow itemIds={day.outfit.itemIds} itemsById={itemsById} />
      </div>
      <h3 className="mt-3 font-serif text-base font-semibold">{day.outfit.title}</h3>
      <p className="mt-1 text-sm text-foreground/65">{day.outfit.rationale}</p>
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
