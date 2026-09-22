import { STYLE_LABELS } from "@/lib/labels";
import { OUTFIT_STYLES, OutfitStyle } from "@/lib/types";

/// Port of `outfit_style_selector.dart` — the occasion styles outfit
/// generation supports (both engines honor this).
export function StyleSelector({
  value,
  onChange,
}: {
  value: OutfitStyle;
  onChange: (style: OutfitStyle) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-5">
      {OUTFIT_STYLES.map((style) => {
        const active = value === style;
        return (
          <button
            key={style}
            onClick={() => onChange(style)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-accent bg-accent text-white"
                : "border-outline text-foreground/70 hover:bg-outline/30"
            }`}
          >
            {STYLE_LABELS[style]}
          </button>
        );
      })}
    </div>
  );
}
