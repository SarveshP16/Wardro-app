"use client";

import { Check } from "lucide-react";

import { useProfile } from "@/app/(shell)/profile-context";
import { categoriesFor, sortCategories } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { ClothingCategory } from "@/lib/types";

/// Category picker shared by the add-item preview form and the edit-item
/// screen. A piece can be in several categories (an overshirt as top *and*
/// outerwear); at least one stays selected. Offers the categories for the
/// profile's Settings → Clothing choice, plus any the piece already has.
export function CategorySelector({
  value,
  onChange,
}: {
  value: ClothingCategory[];
  onChange: (categories: ClothingCategory[]) => void;
}) {
  const { gender } = useProfile();
  const options = sortCategories([...categoriesFor(gender), ...value]);

  function toggle(category: ClothingCategory) {
    if (value.includes(category)) {
      if (value.length > 1) onChange(value.filter((c) => c !== category));
    } else {
      onChange(sortCategories([...value, category]));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Categories" className="flex flex-wrap gap-2">
        {options.map((category) => {
          const Icon = CATEGORY_ICONS[category];
          const active = value.includes(category);
          return (
            <button
              key={category}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggle(category)}
              className={`flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-on-primary"
                  : "border-line bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              {active ? <Check size={14} /> : <Icon size={14} />}
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        Pick more than one if a piece works both ways, e.g. an overshirt as a
        top and outerwear.
      </p>
    </div>
  );
}
