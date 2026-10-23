"use client";

import { CloudSun, MapPin, Search } from "lucide-react";
import { useState } from "react";

import { Switch } from "@/components/ui/Switch";
import type { Place, WeatherSnapshot } from "@/lib/types";

import { PlaceSearch } from "./PlaceSearch";

/// AI Stylist only. Toggling this on
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
  onSearchLocation: (place: Place) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  const summary = loading
    ? "Getting weather…"
    : weather
      ? `${Math.round(weather.temperatureCelsius)}°C, ${weather.description}${
          weather.locationLabel ? ` in ${weather.locationLabel}` : ""
        }`
      : error ?? "Factor in live weather";

  return (
    <div className="flex flex-col gap-1.5 py-1 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CloudSun size={16} className="shrink-0 text-muted" />
          <span
            className={`truncate ${error && !weather ? "text-danger" : "text-ink"}`}
          >
            {summary}
          </span>
        </div>
        <Switch checked={enabled} onChange={onToggle} label="Use live weather" />
      </div>

      {enabled ? (
        searchOpen ? (
          <PlaceSearch
            onPick={(place) => {
              onSearchLocation(place);
              setSearchOpen(false);
            }}
            onCancel={() => setSearchOpen(false)}
          />
        ) : (
          <div className="flex gap-4 pl-6 text-xs">
            <button
              onClick={onUseCurrentLocation}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <MapPin size={12} /> Use current location
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Search size={12} /> Enter location
            </button>
          </div>
        )
      ) : null}
    </div>
  );
}
