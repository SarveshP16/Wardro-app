import { Minus, Plus } from "lucide-react";

/// Port of `outfit_count_stepper.dart` — Quick Match only, how many
/// combinations to return per "Generate" tap.
export function CountStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-1 text-sm">
      <span>Results</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-outline disabled:opacity-30"
          aria-label="Fewer results"
        >
          <Minus size={14} />
        </button>
        <span className="w-4 text-center font-semibold">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-outline disabled:opacity-30"
          aria-label="More results"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
