"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AddItemPreviewForm } from "@/components/wardrobe/add/AddItemPreviewForm";
import { AddItemProcessingView } from "@/components/wardrobe/add/AddItemProcessingView";
import { AddItemSourcePicker } from "@/components/wardrobe/add/AddItemSourcePicker";
import { api } from "@/lib/api";
import type { ClothingCategory } from "@/lib/types";

type Step = "source" | "processing" | "preview";

interface ProcessedPhoto {
  cutout: string;
  dominantColor: number;
}

/// Orchestrates the add-item flow (port of add_item_screen.dart):
/// pick source -> process each photo through rembg -> confirm
/// category/name -> save -> repeat for the rest of the batch.
/// `remaining[0]` is always the photo currently being processed/shown;
/// `remaining.slice(1)` is the rest of the batch still queued.
export default function AddItemPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("source");
  const [remaining, setRemaining] = useState<File[]>([]);
  const [current, setCurrent] = useState<ProcessedPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  async function processQueue(files: File[]) {
    setRemaining(files);
    setCurrent(null);
    if (files.length === 0) {
      router.push("/wardrobe");
      return;
    }
    setStep("processing");
    setError(null);
    try {
      const result = await api.processPhoto(files[0]);
      setCurrent(result);
      setStep("preview");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not process this photo.",
      );
    }
  }

  async function handleSave(data: {
    category: ClothingCategory;
    name: string | null;
  }) {
    if (!current) return;
    setSaving(true);
    try {
      await api.createItem({
        category: data.category,
        name: data.name,
        dominantColor: current.dominantColor,
        cutout: current.cutout,
      });
      setSavedCount((n) => n + 1);
      await processQueue(remaining.slice(1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this item.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-outline px-5 py-4">
        <button
          onClick={() => router.push("/wardrobe")}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          Cancel
        </button>
        <h1 className="flex-1 text-center font-serif text-lg font-semibold">
          Add item{savedCount > 0 ? ` (${savedCount} added)` : ""}
        </h1>
        <span className="w-10" />
      </header>

      {step === "source" ? (
        <AddItemSourcePicker onFilesSelected={processQueue} />
      ) : step === "processing" ? (
        <AddItemProcessingView
          error={error}
          onRetry={() => processQueue(remaining)}
          onSkip={() => processQueue(remaining.slice(1))}
        />
      ) : current ? (
        <AddItemPreviewForm
          cutoutBase64={current.cutout}
          saving={saving}
          onSave={handleSave}
          onSkip={() => processQueue(remaining.slice(1))}
        />
      ) : null}
    </div>
  );
}
