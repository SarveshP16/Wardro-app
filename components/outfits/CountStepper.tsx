import { Minus, Plus } from "lucide-react";

/// A labelled - / + number control: Quick Match's results per tap, Packing
/// List's outfits per trip.
export function CountStepper({
  value,
  onChange,
  max,
  label = "Results",
  hint,
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
  label?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="min-w-0">
        {label}
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line disabled:opacity-30"
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus size={14} />
        </button>
        <span className="w-4 text-center font-semibold">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line disabled:opacity-30"
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
