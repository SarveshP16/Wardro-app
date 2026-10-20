"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/// Header for screens below a tab (item detail, edit, add): a back
/// button, the title, and optional actions.
export function SubpageHeader({
  title,
  actions,
  onBack,
}: {
  title: string;
  actions?: ReactNode;
  /// Defaults to browser back.
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <header className="flex items-center gap-2 px-3 pb-2 pt-4 md:pt-8">
      <button
        type="button"
        onClick={onBack ?? (() => router.back())}
        aria-label="Back"
        className="rounded-control p-2 text-ink hover:bg-surface-2"
      >
        <ArrowLeft size={20} />
      </button>
      <h1 className="display min-w-0 flex-1 truncate text-lg">{title}</h1>
      {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
    </header>
  );
}
