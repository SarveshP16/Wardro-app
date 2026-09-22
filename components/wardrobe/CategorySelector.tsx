import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { CATEGORY_LABELS } from "@/lib/labels";
import { CLOTHING_CATEGORIES, ClothingCategory } from "@/lib/types";

/// Shared category-picking chip row, used by both the add-item preview
/// form and the edit-item screen (port of
/// `add_item_category_selector.dart`).
export function CategorySelector({
  value,
  onChange,
}: {
  value: ClothingCategory;
  onChange: (category: ClothingCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CLOTHING_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category];
        const active = value === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-accent bg-accent text-white"
                : "border-outline text-foreground/70 hover:bg-outline/30"
            }`}
          >
            <Icon size={16} /> {CATEGORY_LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}
