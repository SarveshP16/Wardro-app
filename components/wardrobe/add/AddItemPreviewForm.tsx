"use client";

import { RotateCcw, RotateCw } from "lucide-react";
import { useState } from "react";

import { CategorySelector } from "@/components/wardrobe/CategorySelector";
import { Button } from "@/components/ui/Button";
import { rotateBase64Png } from "@/lib/rotateImage";
import type { ClothingCategory } from "@/lib/types";

/// Port of `add_item_preview_form.dart` — the second step of the
/// add-item flow: confirm the category and optionally name the item
/// before it's saved. Also lets you rotate the cutout in place (e.g. a
/// photo that came out sideways/landscape) before saving.
export function AddItemPreviewForm({
  cutoutBase64,
  saving,
  onSave,
  onSkip,
}: {
  cutoutBase64: string;
  saving: boolean;
  onSave: (data: {
    category: ClothingCategory;
    name: string | null;
    cutout: string;
  }) => void;
  onSkip: () => void;
}) {
  const [category, setCategory] = useState<ClothingCategory>("top");
  const [name, setName] = useState("");
  const [cutout, setCutout] = useState(cutoutBase64);
  const [rotating, setRotating] = useState(false);

  async function rotate(degrees: 90 | 270) {
    setRotating(true);
    try {
      setCutout(await rotateBase64Png(cutout, degrees));
    } catch {
      // Non-fatal -- the unrotated preview just stays as-is.
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 py-4">
      <div className="mx-auto flex flex-col items-center gap-2">
        <div className="flex aspect-square w-56 items-center justify-center rounded-2xl bg-photo-backdrop">
          {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral base64 preview, never a static asset */}
          <img
            src={`data:image/png;base64,${cutout}`}
            alt="Cutout preview"
            className="h-full w-full object-contain p-3"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => rotate(270)}
            disabled={rotating}
            aria-label="Rotate left"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-outline text-foreground/70 transition-colors hover:bg-outline/30 disabled:opacity-40"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={() => rotate(90)}
            disabled={rotating}
            aria-label="Rotate right"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-outline text-foreground/70 transition-colors hover:bg-outline/30 disabled:opacity-40"
          >
            <RotateCw size={16} />
          </button>
        </div>
        <p className="text-xs text-foreground/45">
          Photo came out sideways? Rotate it before saving.
        </p>
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
          onClick={() => onSave({ category, name: name.trim() || null, cutout })}
          disabled={saving || rotating}
          className="flex-1"
        >
          {saving ? "Saving…" : "Save item"}
        </Button>
      </div>
    </div>
  );
}
