"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SubpageHeader } from "@/components/SubpageHeader";
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

/// Orchestrates the add-item flow: pick source -> process each photo
/// through rembg -> confirm category/name -> save -> repeat for the rest
/// of the batch. `remaining[0]` is always the photo currently being
/// processed/shown; `remaining.slice(1)` is the rest of the batch still
/// queued.
export default function AddItemPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("source");
  const [remaining, setRemaining] = useState<File[]>([]);
  const [batchSize, setBatchSize] = useState(0);
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

  function startBatch(files: File[]) {
    setBatchSize(files.length);
    void processQueue(files);
  }

  async function handleSave(data: {
    categories: ClothingCategory[];
    name: string | null;
    cutout: string;
  }) {
    if (!current) return;
    setSaving(true);
    try {
      await api.createItem({
        categories: data.categories,
        name: data.name,
        dominantColor: current.dominantColor,
        cutout: data.cutout,
      });
      setSavedCount((n) => n + 1);
      await processQueue(remaining.slice(1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this piece.",
      );
    } finally {
      setSaving(false);
    }
  }

  // "Photo 2 of 5" while working through a multi-photo batch.
  const position = batchSize - remaining.length + 1;
  const title =
    step !== "source" && batchSize > 1
      ? `Photo ${position} of ${batchSize}`
      : "Add pieces";

  return (
    <div className="flex flex-1 flex-col">
      <SubpageHeader title={title} onBack={() => router.push("/wardrobe")} />
      {savedCount > 0 ? (
        <p className="px-5 text-xs text-muted">
          {savedCount} added to your wardrobe
        </p>
      ) : null}

      {step === "source" ? (
        <AddItemSourcePicker onFilesSelected={startBatch} />
      ) : step === "processing" ? (
        <AddItemProcessingView
          error={error}
          onRetry={() => processQueue(remaining)}
          onSkip={() => processQueue(remaining.slice(1))}
        />
      ) : current ? (
        <AddItemPreviewForm
          key={position}
          cutoutBase64={current.cutout}
          saving={saving}
          error={error}
          onSave={handleSave}
          onSkip={() => processQueue(remaining.slice(1))}
        />
      ) : null}
    </div>
  );
}
