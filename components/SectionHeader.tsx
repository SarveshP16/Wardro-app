import type { ReactNode } from "react";

/// Port of `section_header.dart` — a titled row, optionally with a
/// trailing action/control.
export function SectionHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-5 pt-6 pb-2">
      <div>
        <h2 className="font-serif text-xl font-semibold leading-tight">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-foreground/60">{subtitle}</p>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}
