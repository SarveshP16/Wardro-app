import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";

/// Shown while a photo is going through background removal, or the error
/// state if that failed.
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
        <p role="alert" className="max-w-xs text-sm text-danger">
          {error}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onSkip}>
            Skip this photo
          </Button>
          <Button onClick={onRetry}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Loader2 size={32} className="animate-spin text-muted" />
      <p className="text-sm text-muted">Removing the background…</p>
    </div>
  );
}
