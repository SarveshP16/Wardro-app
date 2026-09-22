import type { ReactNode } from "react";

/// Port of `empty_state.dart` — centered icon + message, optionally with
/// an action underneath.
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="text-foreground/35">{icon}</div>
      <p className="font-serif text-lg font-semibold">{title}</p>
      {message ? (
        <p className="max-w-xs text-sm text-foreground/60">{message}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
