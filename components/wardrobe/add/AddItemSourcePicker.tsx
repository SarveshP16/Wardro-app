"use client";

import { Camera, ImagePlus } from "lucide-react";
import { useRef, type ChangeEvent } from "react";

import { Button } from "@/components/ui/Button";

/// First step of the add-item flow: take a photo or pick several from the
/// gallery. `capture="environment"` opens the rear camera directly on
/// phones; the gallery input allows multi-select.
export function AddItemSourcePicker({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) onFilesSelected(files);
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-8 px-5 py-10 md:max-w-md">
      <div>
        <h2 className="display text-2xl leading-tight">Photograph your clothes</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Lay each piece flat or hang it up, one per photo. Wardro removes
          the background and picks out its colour.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button
          icon={<Camera size={18} />}
          onClick={() => cameraInputRef.current?.click()}
        >
          Take a photo
        </Button>
        <Button
          variant="secondary"
          icon={<ImagePlus size={18} />}
          onClick={() => galleryInputRef.current?.click()}
        >
          Choose from gallery
        </Button>
        <p className="text-xs text-muted">
          Pick several photos at once to add them one after another.
        </p>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
