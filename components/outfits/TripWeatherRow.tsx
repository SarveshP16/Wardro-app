"use client";

import { CloudSun, MapPin, Search } from "lucide-react";
import { useState } from "react";

import { Switch } from "@/components/ui/Switch";
import { placeLabel, type TripWeather } from "@/lib/weather";
import type { DailyForecast, Place } from "@/lib/types";

import { PlaceSearch } from "./PlaceSearch";

/// The trip's average temperature, or null with no weather.
export function tripAverageCelsius(days: DailyForecast[]): number | null {
  if (days.length === 0) return null;
  return days.reduce((sum, d) => sum + d.temperatureCelsius, 0) / days.length;
}

/// "~25° (19–29°) · forecast" -- the trip's average, coolest low and
/// warmest high, and where the numbers come from.
function tripTemperatureSummary(days: DailyForecast[]): string | null {
  const average = tripAverageCelsius(days);
  if (average === null) return null;
  const low = Math.min(...days.map((d) => d.lowCelsius));
  const high = Math.max(...days.map((d) => d.highCelsius));
  const forecast = days.some((d) => d.source === "forecast");
  const typical = days.some((d) => d.source === "typical");
  const source =
    forecast && typical ? "forecast + typical" : forecast ? "forecast" : "typical for these dates";
  return `~${Math.round(average)}° (${Math.round(low)}–${Math.round(high)}°) · ${source}`;
}

/// Packing List's weather control: where the trip is to -- null means the
/// device's current location -- with the weather there now and over the
/// trip's dates (fetched by outfits/page.tsx, which also hands the same
/// days to the AI Stylist).
export function TripWeatherRow({
  enabled,
  destination,
  weather,
  loading,
  error,
  onToggle,
  onDestinationChange,
}: {
  enabled: boolean;
  destination: Place | null;
  weather: TripWeather | null;
  loading: boolean;
  error: string | null;
  onToggle: () => void;
  onDestinationChange: (destination: Place | null) => void;
}) {
  const [editing, setEditing] = useState(false);

  const title = !enabled
    ? "Factor in the weather"
    : destination
      ? placeLabel(destination)
      : weather?.locationLabel
        ? `${weather.locationLabel} (current location)`
        : "Current location";
  const trip = weather ? tripTemperatureSummary(weather.days) : null;

  return (
    <div className="flex flex-col gap-1.5 py-1 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-ink">
          <CloudSun size={16} className="shrink-0 text-muted" />
          <span className="truncate">{title}</span>
        </div>
        <Switch checked={enabled} onChange={onToggle} label="Use the weather" />
      </div>

      {enabled ? (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 pl-6 text-xs" aria-live="polite">
            {loading ? (
              <span className="text-muted">Getting the weather…</span>
            ) : error ? (
              <span className="text-danger">{error}</span>
            ) : weather ? (
              <>
                {weather.now ? (
                  <span>
                    <span className="text-muted">Now </span>
                    <span className="text-ink">
                      {Math.round(weather.now.temperatureCelsius)}°
                      {weather.now.description ? `, ${weather.now.description}` : ""}
                    </span>
                  </span>
                ) : null}
                {trip ? (
                  <span>
                    <span className="text-muted">During trip </span>
                    <span className="text-ink">{trip}</span>
                  </span>
                ) : null}
              </>
            ) : null}
          </div>

          {editing ? (
            <PlaceSearch
              placeholder="Where are you going?"
              onPick={(place) => {
                onDestinationChange(place);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="flex gap-4 pl-6 text-xs">
              {destination ? (
                <button
                  onClick={() => onDestinationChange(null)}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <MapPin size={12} /> Use current location
                </button>
              ) : null}
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Search size={12} /> {destination ? "Change destination" : "Enter destination"}
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
