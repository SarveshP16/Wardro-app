"use client";

import type { ComponentType } from "react";

type Icon = ComponentType<{ size?: number; className?: string }>;

/// A wrapping row of single-select chips (occasion, season, category).
/// Wraps instead of scrolling so every option is visible at once.
export function ChoiceChips<T extends string | null>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: Icon }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value ?? "none"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-on-primary"
                : "border-line bg-surface text-ink hover:bg-surface-2"
            }`}
          >
            {Icon ? <Icon size={14} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
