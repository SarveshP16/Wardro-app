import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";

/// Port of `add_item_processing_view.dart` — shown while a photo is being
/// sent through the rembg sidecar, or the error state if that failed.
export function AddItemProcessingView({
  error,
  onRetry,
  onSkip,
}: {
  error: string | null;
  onRetry: () => void;
  onSkip: () => void;
}) {
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <div className="flex gap-3">
          <Button variant="outlined" onClick={onSkip}>
            Skip this photo
          </Button>
          <Button onClick={onRetry}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Loader2 size={40} className="animate-spin text-accent" />
      <p className="text-sm text-foreground/60">Removing the background…</p>
    </div>
  );
}
