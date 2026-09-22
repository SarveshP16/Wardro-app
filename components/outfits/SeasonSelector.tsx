import { SEASON_LABELS } from "@/lib/labels";
import { SEASON_ICONS } from "@/lib/seasonIcons";
import { SEASONS, Season } from "@/lib/types";

/// Season filter for outfit generation. `null` means "any season" --
/// the AI Stylist factors the selected season into fabric weight,
/// layering, and color choices (see lib/anthropic.ts); Quick Match
/// ignores it, same as it already ignores `style`.
export function SeasonSelector({
  value,
  onChange,
}: {
  value: Season | null;
  onChange: (season: Season | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-5">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
          value === null
            ? "border-accent bg-accent text-white"
            : "border-outline text-foreground/70 hover:bg-outline/30"
        }`}
      >
        Any season
      </button>
      {SEASONS.map((season) => {
        const Icon = SEASON_ICONS[season];
        const active = value === season;
        return (
          <button
            key={season}
            onClick={() => onChange(season)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-accent bg-accent text-white"
                : "border-outline text-foreground/70 hover:bg-outline/30"
            }`}
          >
            <Icon size={16} /> {SEASON_LABELS[season]}
          </button>
        );
      })}
    </div>
  );
}
