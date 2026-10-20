"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, type FormEvent } from "react";

import { useLook } from "@/app/look-context";
import { PageHeader } from "@/components/PageHeader";
import { ProfileAvatar, ProfileColorPicker } from "@/components/profile/ProfileAvatar";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { api } from "@/lib/api";
import {
  MAX_PROFILE_NAME_LENGTH,
  type Look,
  type ProfileColor,
  type ThemeMode,
} from "@/lib/types";
import pkg from "@/package.json";

import { useProfile } from "../profile-context";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/// Each look's own palette, hard-coded here (rather than via tokens) so
/// both previews always show what you'd get, whatever's active.
const LOOK_PREVIEWS: {
  look: Look;
  name: string;
  description: string;
  light: { bg: string; ink: string; board: string; primary: string };
  dark: { bg: string; ink: string; board: string; primary: string };
  font: string;
  stretch: string;
  weight: number;
}[] = [
  {
    look: "navy",
    name: "Tailor's navy",
    description: "Navy and shirting blue, wide label-style headings, outfits as a flat-lay.",
    light: { bg: "#e6eaef", ink: "#16253b", board: "#dce2e9", primary: "#22395c" },
    dark: { bg: "#111925", ink: "#e4e9f0", board: "#c5ced9", primary: "#c3d3ea" },
    font: "var(--font-archivo)",
    stretch: "125%",
    weight: 800,
  },
  {
    look: "colour",
    name: "Colour story",
    description: "Plain gallery screens where your clothes' colours lead: spectrum, colour bands.",
    light: { bg: "#ffffff", ink: "#1c1c1c", board: "#f0efec", primary: "#1c1c1c" },
    dark: { bg: "#1d1d1c", ink: "#f1f1ef", board: "#d9d7d2", primary: "#f1f1ef" },
    font: "var(--font-schibsted)",
    stretch: "100%",
    weight: 750,
  },
];

/// A few real-ish garment colours for the Colour story preview stripe.
const PREVIEW_SPECTRUM = ["#7c3f2d", "#b98c22", "#62785c", "#4c5b72", "#191d2b", "#9e9892", "#d9d4cc"];

/// Settings: your profile, the look and theme (both saved per profile),
/// and app info.
export default function SettingsPage() {
  const router = useRouter();
  const profile = useProfile();
  const look = useLook();
  const { setTheme } = useTheme();
  const [pendingLook, setPendingLook] = useState<Look | null>(null);
  // Local copy of the saved theme so the control updates instantly
  // (next-themes' own value isn't known during server render).
  const [themeMode, setThemeMode] = useState<ThemeMode>(profile.themeMode);

  async function chooseLook(next: Look) {
    if (next === look) return;
    setPendingLook(next);
    // Swap tokens immediately; the refresh then re-renders server
    // components (and useLook()) with the saved value.
    document.documentElement.setAttribute("data-look", next);
    try {
      await api.updateSettings({ look: next });
    } finally {
      router.refresh();
      setPendingLook(null);
    }
  }

  async function chooseTheme(mode: ThemeMode) {
    setThemeMode(mode);
    setTheme(mode);
    await api.updateSettings({ themeMode: mode }).catch(() => {});
    router.refresh();
  }

  const currentLook = pendingLook ?? look;

  return (
    <div className="flex flex-1 flex-col pb-10">
      <PageHeader title="Settings" />

      <div className="flex flex-col gap-10 px-5 pt-4 md:max-w-xl">
        <Section title="Profile">
          <ProfileEditor key={`${profile.id}-${profile.name}-${profile.color}`} />
          <Link href="/profiles" className={`${buttonClasses("secondary", "sm")} self-start`}>
            Switch profile
          </Link>
        </Section>

        <Section title="Look" description="Saved for your profile, on every device.">
          <div role="radiogroup" aria-label="Look" className="grid gap-3 sm:grid-cols-2">
            {LOOK_PREVIEWS.map((preview) => {
              // Both palettes go in as CSS variables and the dark: variant
              // picks one -- the theme isn't known during server render.
              const paletteVars = {
                "--pv-bg": preview.light.bg,
                "--pv-ink": preview.light.ink,
                "--pv-board": preview.light.board,
                "--pv-primary": preview.light.primary,
                "--pv-bg-dark": preview.dark.bg,
                "--pv-ink-dark": preview.dark.ink,
                "--pv-board-dark": preview.dark.board,
                "--pv-primary-dark": preview.dark.primary,
              } as React.CSSProperties;
              const selected = currentLook === preview.look;
              return (
                <button
                  key={preview.look}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseLook(preview.look)}
                  className={`flex flex-col overflow-hidden rounded-card border-2 text-left transition-colors ${
                    selected ? "border-primary" : "border-line hover:border-muted"
                  }`}
                >
                  <span
                    aria-hidden
                    className="flex h-24 items-end justify-between gap-3 bg-[var(--pv-bg)] p-3 text-[var(--pv-ink)] dark:bg-[var(--pv-bg-dark)] dark:text-[var(--pv-ink-dark)]"
                    style={paletteVars}
                  >
                    <span
                      className="text-[30px] leading-none"
                      style={{
                        fontFamily: preview.font,
                        fontStretch: preview.stretch,
                        fontWeight: preview.weight,
                        letterSpacing: preview.look === "colour" ? "-0.035em" : "-0.01em",
                      }}
                    >
                      Aa
                    </span>
                    {preview.look === "navy" ? (
                      <span className="flex gap-1.5">
                        <span className="h-9 w-9 rounded-[8px] bg-[var(--pv-board)] dark:bg-[var(--pv-board-dark)]" />
                        <span className="h-9 w-9 rounded-[8px] bg-[var(--pv-primary)] dark:bg-[var(--pv-primary-dark)]" />
                      </span>
                    ) : (
                      <span className="flex h-3 w-24">
                        {PREVIEW_SPECTRUM.map((c) => (
                          <span key={c} className="flex-1" style={{ backgroundColor: c }} />
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-1 bg-surface p-3">
                    <span className="flex items-center justify-between text-sm font-semibold">
                      {preview.name}
                      {selected ? <Check size={16} /> : null}
                    </span>
                    <span className="text-xs leading-relaxed text-muted">
                      {preview.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Theme">
          <Segmented<ThemeMode>
            label="Theme"
            value={themeMode}
            onChange={chooseTheme}
            options={THEME_OPTIONS}
          />
        </Section>

        <p className="text-xs text-muted">Wardro v{pkg.version}</p>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="display text-[15px]">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/// Rename / recolour the active profile in place.
function ProfileEditor() {
  const router = useRouter();
  const profile = useProfile();
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState<ProfileColor>(profile.color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = name.trim() !== profile.name || color !== profile.color;

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateProfile(profile.id, { name, color });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProfileAvatar name={name || "?"} color={color} size={44} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Profile name"
          maxLength={MAX_PROFILE_NAME_LENGTH}
          className="min-w-0 flex-1 rounded-control border border-line bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </div>
      <ProfileColorPicker value={color} onChange={setColor} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {dirty ? (
        <Button type="submit" size="sm" disabled={saving || !name.trim()} className="self-start">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      ) : null}
    </form>
  );
}
