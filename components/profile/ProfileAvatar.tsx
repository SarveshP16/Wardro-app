import { PROFILE_COLORS, type ProfileColor } from "@/lib/types";

/// A profile's initial on its chosen color.
export function ProfileAvatar({
  name,
  color,
  size = 36,
  className = "",
}: {
  name: string;
  color: ProfileColor;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`display inline-flex shrink-0 items-center justify-center rounded-full text-white ring-1 ring-inset ring-white/20 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        backgroundColor: PROFILE_COLORS[color],
      }}
    >
      {Array.from(name.trim())[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

/// Row of color swatches for picking a profile's avatar color.
export function ProfileColorPicker({
  value,
  onChange,
}: {
  value: ProfileColor;
  onChange: (color: ProfileColor) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Avatar color" className="flex gap-2.5">
      {(Object.keys(PROFILE_COLORS) as ProfileColor[]).map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          className={`h-8 w-8 rounded-full transition-shadow ${
            value === color
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
              : ""
          }`}
          style={{ backgroundColor: PROFILE_COLORS[color] }}
        />
      ))}
    </div>
  );
}
