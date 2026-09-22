"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { api } from "@/lib/api";
import pkg from "@/package.json";

const MODES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

/// Port of `settings_screen.dart` + `theme_mode_selector.dart`. Theme is
/// persisted through /api/settings (backed by the `Setting` table) so
/// every device on the Tailscale network converges on the same choice,
/// unlike the original's per-install Hive value.
export default function SettingsPage() {
  // `theme` is undefined until next-themes mounts client-side, which
  // naturally keeps every button inactive on the server-rendered pass --
  // no separate "mounted" flag needed.
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    api
      .getSettings()
      .then((s) => setTheme(s.themeMode))
      .catch(() => {});
    // Only ever needs to run once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(mode: string) {
    setTheme(mode);
    await api.setThemeMode(mode).catch(() => {});
  }

  return (
    <div className="flex flex-1 flex-col">
      <SectionHeader title="Settings" />

      <div className="px-5 py-3">
        <p className="mb-2 text-sm font-semibold">Theme</p>
        <div className="flex gap-2">
          {MODES.map((m) => {
            const active = theme === m.value;
            return (
              <button
                key={m.value}
                onClick={() => handleSelect(m.value)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-outline text-foreground/70 hover:bg-outline/30"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto px-5 pb-8 pt-6 text-center text-xs text-foreground/40">
        Wardro v{pkg.version}
      </div>
    </div>
  );
}
