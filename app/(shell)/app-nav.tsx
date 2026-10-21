"use client";

import { Settings2, Shirt, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLook } from "@/app/look-context";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

import { useProfile } from "./profile-context";

const DESTINATIONS = [
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

/// The three top-level tabs. On phones it's a bottom bar (icons + labels
/// in Tailor's navy, text only in Colour story); from the `md`
/// breakpoint up it becomes a sidebar with the brand and the current
/// profile.
export function AppNav() {
  const pathname = usePathname();
  const look = useLook();
  const profile = useProfile();

  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-20 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:top-[var(--safe-top)] md:order-first md:h-[calc(100dvh-var(--safe-top))] md:w-60 md:flex-col md:border-r md:border-t-0 md:px-4 md:pb-6 md:pt-8"
    >
      <Link
        href="/wardrobe"
        className="display mb-8 hidden px-3 text-lg md:block"
      >
        Wardro
      </Link>

      <div className="flex flex-1 md:flex-none md:flex-col md:gap-1">
        {DESTINATIONS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 items-center justify-center gap-1 transition-colors md:flex-none md:justify-start md:gap-3 md:rounded-control md:px-3 md:py-2.5 md:text-sm ${
                look === "colour"
                  ? "py-4 text-[13px]"
                  : "flex-col pb-3 pt-2.5 text-[11px] md:flex-row"
              } ${
                active
                  ? "font-semibold text-ink md:bg-surface-2"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Icon
                size={21}
                strokeWidth={active ? 2.2 : 1.7}
                className={look === "colour" ? "hidden md:block" : ""}
              />
              <span className="flex items-center gap-1.5">
                {label}
                {look === "colour" && active ? (
                  <span className="h-1 w-1 rounded-full bg-ink md:hidden" />
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/profiles"
        className="mt-auto hidden items-center gap-3 rounded-control px-3 py-2.5 hover:bg-surface-2 md:flex"
      >
        <ProfileAvatar name={profile.name} color={profile.color} size={32} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {profile.name}
          </span>
          <span className="block text-xs text-muted">Switch profile</span>
        </span>
      </Link>
    </nav>
  );
}
