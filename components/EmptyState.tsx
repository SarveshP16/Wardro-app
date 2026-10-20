import type { ReactNode } from "react";

/// Centered message for an empty or not-yet-used screen, ideally with
/// the action that fills it.
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      {icon ? <div className="text-muted">{icon}</div> : null}
      <p className="display text-lg">{title}</p>
      {message ? (
        <p className="max-w-xs text-sm text-muted">{message}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
