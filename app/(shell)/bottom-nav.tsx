"use client";

import { Settings, Shirt, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/// Port of `app_shell.dart`'s bottom NavigationBar — three top-level
/// tabs: Wardrobe / Outfits / Settings.
const DESTINATIONS = [
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-outline bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {DESTINATIONS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              active ? "text-accent" : "text-foreground/55 hover:text-foreground/80"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
