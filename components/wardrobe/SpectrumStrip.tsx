import { toHex } from "@/lib/color";
import { compareByColor } from "@/lib/colorNames";

/// Every piece's dominant colour, side by side in spectrum order -- the
/// wardrobe at a glance (Colour story's wardrobe header, and each name
/// on its profile picker).
export function SpectrumStrip({
  colors,
  className = "",
}: {
  colors: number[];
  className?: string;
}) {
  const sorted = [...colors].sort(compareByColor);
  if (sorted.length === 0) {
    return <div aria-hidden className={`bg-line ${className}`} />;
  }
  return (
    <div aria-hidden className={`flex overflow-hidden ${className}`}>
      {sorted.map((color, index) => (
        <span
          key={index}
          className="flex-1"
          style={{ backgroundColor: toHex(color) }}
        />
      ))}
    </div>
  );
}
