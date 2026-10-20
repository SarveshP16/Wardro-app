"use client";

import { RotateCcw, RotateCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { CategorySelector } from "@/components/wardrobe/CategorySelector";
import { rotateBase64Png } from "@/lib/rotateImage";
import type { ClothingCategory } from "@/lib/types";

/// Second step of the add-item flow: check the cutout (rotating it if the
/// photo came out sideways), pick the category, optionally name it, save.
export function AddItemPreviewForm({
  cutoutBase64,
  saving,
  error,
  onSave,
  onSkip,
}: {
  cutoutBase64: string;
  saving: boolean;
  error: string | null;
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
    <div className="flex flex-1 flex-col gap-6 px-5 pb-8 pt-4 md:max-w-lg">
      <div className="relative aspect-square w-full max-w-72 self-center overflow-hidden rounded-card bg-board">
        {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral base64 preview, never a static asset */}
        <img
          src={`data:image/png;base64,${cutout}`}
          alt="Cutout preview"
          className="absolute inset-0 h-full w-full object-contain p-4"
        />
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => rotate(270)}
            disabled={rotating}
            aria-label="Rotate left"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={() => rotate(90)}
            disabled={rotating}
            aria-label="Rotate right"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold">Category</p>
        <CategorySelector value={category} onChange={setCategory} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-semibold" htmlFor="item-name">
          Name <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Blue denim jacket"
          className="w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="mt-auto flex gap-3">
        <Button
          variant="secondary"
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
          {saving ? "Saving…" : "Save piece"}
        </Button>
      </div>
    </div>
  );
}
