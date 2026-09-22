export type OutfitMode = "ai" | "quickMatch";

/// Port of `outfit_mode_toggle.dart` — segmented control between the
/// free, offline Quick Match matcher and the paid AI Stylist.
export function OutfitModeToggle({
  mode,
  onChange,
}: {
  mode: OutfitMode;
  onChange: (mode: OutfitMode) => void;
}) {
  return (
    <div className="mx-5 mt-3 flex rounded-full border border-outline p-1">
      <SegmentButton
        active={mode === "quickMatch"}
        onClick={() => onChange("quickMatch")}
      >
        Quick Match
      </SegmentButton>
      <SegmentButton active={mode === "ai"} onClick={() => onChange("ai")}>
        AI Stylist
      </SegmentButton>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
        active ? "bg-accent text-white" : "text-foreground/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
