import { Loader2 } from "lucide-react";

/// Shown while outfits are being generated.
export function OutfitGeneratingView() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Loader2 size={28} className="animate-spin text-muted" />
      <p className="text-sm text-muted">Putting outfits together…</p>
    </div>
  );
}
