"use client";

import { useState } from "react";

import { CategorySelector } from "@/components/wardrobe/CategorySelector";
import { Button } from "@/components/ui/Button";
import type { ClothingCategory } from "@/lib/types";

/// Port of `add_item_preview_form.dart` — the second step of the
/// add-item flow: confirm the category and optionally name the item
/// before it's saved.
export function AddItemPreviewForm({
  cutoutBase64,
  saving,
  onSave,
  onSkip,
}: {
  cutoutBase64: string;
  saving: boolean;
  onSave: (data: { category: ClothingCategory; name: string | null }) => void;
  onSkip: () => void;
}) {
  const [category, setCategory] = useState<ClothingCategory>("top");
  const [name, setName] = useState("");

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 py-4">
      <div className="mx-auto flex aspect-square w-56 items-center justify-center rounded-2xl bg-photo-backdrop">
        {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral base64 preview, never a static asset */}
        <img
          src={`data:image/png;base64,${cutoutBase64}`}
          alt="Cutout preview"
          className="h-full w-full object-contain p-3"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Category</p>
        <CategorySelector value={category} onChange={setCategory} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="item-name">
          Name (optional)
        </label>
        <input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Blue denim jacket"
          className="w-full rounded-xl border border-outline bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="mt-auto flex gap-3 pb-4">
        <Button
          variant="outlined"
          onClick={onSkip}
          disabled={saving}
          className="flex-1"
        >
          Skip
        </Button>
        <Button
          onClick={() => onSave({ category, name: name.trim() || null })}
          disabled={saving}
          className="flex-1"
        >
          {saving ? "Saving…" : "Save item"}
        </Button>
      </div>
    </div>
  );
}
