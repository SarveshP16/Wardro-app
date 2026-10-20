"use client";

/// Underlined text tabs -- wardrobe categories, Create/Saved. Scrolls
/// sideways (without a visible scrollbar) when the row is wider than the
/// screen.
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
  trailing,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string; count?: number }[];
  label: string;
  /// Pinned at the right end of the row, outside the scrolling area.
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end border-b border-line ${className}`}>
      <div
        role="tablist"
        aria-label={label}
        className={`no-scrollbar flex min-w-0 flex-1 gap-5 overflow-x-auto px-5 ${
          trailing ? "[mask-image:linear-gradient(to_right,black_85%,transparent)]" : ""
        }`}
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={`-mb-px shrink-0 border-b-2 pb-2.5 pt-1 text-sm transition-colors ${
                active
                  ? "border-primary font-semibold text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {item.label}
              {typeof item.count === "number" ? (
                <span className="ml-1 text-[11px] font-medium text-muted">
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {trailing ? <div className="shrink-0 pb-1.5 pr-5">{trailing}</div> : null}
    </div>
  );
}
