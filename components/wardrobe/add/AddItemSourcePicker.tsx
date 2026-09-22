"use client";

import { Camera, ImagePlus } from "lucide-react";
import { useRef, type ChangeEvent } from "react";

import { Button } from "@/components/ui/Button";

/// Port of `add_item_source_picker.dart` — the first step of the add-item
/// flow: choose whether the new photo(s) come from the camera or the
/// gallery. `capture="environment"` opens the rear camera directly on
/// mobile browsers; the gallery input allows multi-select.
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
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <div className="text-accent">
        <ImagePlus size={56} strokeWidth={1.25} />
      </div>
      <div>
        <h2 className="font-serif text-xl font-semibold">
          Add a wardrobe item
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-foreground/60">
          Lay each item flat or on a hanger. Take a photo, or pick several
          from your gallery at once, and Wardro will lift them out of the
          background — clean product shots, automatically.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          icon={<Camera size={18} />}
          onClick={() => cameraInputRef.current?.click()}
        >
          Take a photo
        </Button>
        <Button
          variant="outlined"
          icon={<ImagePlus size={18} />}
          onClick={() => galleryInputRef.current?.click()}
        >
          Choose from gallery
        </Button>
      </div>
      <p className="text-xs text-foreground/45">
        Select multiple photos to add them one after another.
      </p>

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
