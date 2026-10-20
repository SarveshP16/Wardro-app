"use client";

import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { CATEGORY_LABELS } from "@/lib/labels";
import { CLOTHING_CATEGORIES, ClothingCategory } from "@/lib/types";

/// Category picker shared by the add-item preview form and the edit-item
/// screen.
export function CategorySelector({
  value,
  onChange,
}: {
  value: ClothingCategory;
  onChange: (category: ClothingCategory) => void;
}) {
  return (
    <ChoiceChips<ClothingCategory>
      label="Category"
      value={value}
      onChange={onChange}
      options={CLOTHING_CATEGORIES.map((category) => ({
        value: category,
        label: CATEGORY_LABELS[category],
        icon: CATEGORY_ICONS[category],
      }))}
    />
  );
}
