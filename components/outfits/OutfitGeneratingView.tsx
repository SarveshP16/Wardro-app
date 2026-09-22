import { Loader2 } from "lucide-react";

/// Port of `outfit_generating_view.dart`.
export function OutfitGeneratingView() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <Loader2 size={32} className="animate-spin text-accent" />
      <p className="text-sm text-foreground/60">Putting outfits together…</p>
    </div>
  );
}
