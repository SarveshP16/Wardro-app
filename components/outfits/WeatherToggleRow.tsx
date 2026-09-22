"use client";

import { CloudSun, MapPin, Search } from "lucide-react";
import { useState } from "react";

import { Switch } from "@/components/ui/Switch";
import type { WeatherSnapshot } from "@/lib/types";

/// Port of `weather_toggle_row.dart` — AI Stylist only. Toggling this on
/// triggers a browser geolocation + Open-Meteo fetch (see
/// lib/weather.ts); the summary here reflects whatever that returned.
/// Also offers a manual location search for when GPS is unavailable, off,
/// or you just want the weather somewhere else.
export function WeatherToggleRow({
  enabled,
  weather,
  loading,
  error,
  onToggle,
  onUseCurrentLocation,
  onSearchLocation,
}: {
  enabled: boolean;
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
  onToggle: () => void;
  onUseCurrentLocation: () => void;
  onSearchLocation: (query: string) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const summary = loading
    ? "Getting weather…"
    : weather
      ? `${Math.round(weather.temperatureCelsius)}°C, ${weather.description}${
          weather.locationLabel ? ` in ${weather.locationLabel}` : ""
        }`
      : error ?? "Factor in live weather";

  function submitSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearchLocation(trimmed);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-1.5 px-5 py-1 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CloudSun size={16} className="shrink-0 text-foreground/60" />
          <span
            className={`truncate ${error && !weather ? "text-red-600" : "text-foreground/70"}`}
          >
            {summary}
          </span>
        </div>
        <Switch checked={enabled} onChange={onToggle} label="Use live weather" />
      </div>

      {enabled ? (
        searchOpen ? (
          <div className="flex gap-2 pl-6">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
                if (e.key === "Escape") setSearchOpen(false);
              }}
              placeholder="City or place name"
              className="min-w-0 flex-1 rounded-lg border border-outline bg-surface px-2.5 py-1 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={submitSearch}
              aria-label="Search location"
              className="flex items-center justify-center rounded-lg border border-outline px-2 text-foreground/70 hover:bg-outline/30"
            >
              <Search size={14} />
            </button>
            <button
              onClick={() => setSearchOpen(false)}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-4 pl-6 text-xs">
            <button
              onClick={onUseCurrentLocation}
              className="flex items-center gap-1 text-accent hover:underline"
            >
              <MapPin size={12} /> Use current location
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1 text-accent hover:underline"
            >
              <Search size={12} /> Enter location
            </button>
          </div>
        )
      ) : null}
    </div>
  );
}
