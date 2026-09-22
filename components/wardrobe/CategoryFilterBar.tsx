"use client";

import type { ReactNode } from "react";

import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { CATEGORY_LABELS } from "@/lib/labels";
import { CLOTHING_CATEGORIES, ClothingCategory } from "@/lib/types";

/// Port of `category_filter_bar.dart` — a horizontally scrolling row of
/// chips, "All" plus one per category.
export function CategoryFilterBar({
  selected,
  onChange,
}: {
  selected: ClothingCategory | null;
  onChange: (category: ClothingCategory | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-5 py-2">
      <FilterChip
        label="All"
        active={selected === null}
        onClick={() => onChange(null)}
      />
      {CLOTHING_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category];
        return (
          <FilterChip
            key={category}
            label={CATEGORY_LABELS[category]}
            icon={<Icon size={16} />}
            active={selected === category}
            onClick={() => onChange(category)}
          />
        );
      })}
    </div>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-white"
          : "border-outline text-foreground/70 hover:bg-outline/30"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
