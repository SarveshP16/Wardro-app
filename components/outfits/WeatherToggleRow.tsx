import { CloudSun } from "lucide-react";

import { Switch } from "@/components/ui/Switch";
import type { WeatherSnapshot } from "@/lib/types";

/// Port of `weather_toggle_row.dart` — AI Stylist only. Toggling this on
/// triggers a browser geolocation + Open-Meteo fetch (see
/// lib/weather.ts); the summary here reflects whatever that returned.
export function WeatherToggleRow({
  enabled,
  weather,
  loading,
  error,
  onToggle,
}: {
  enabled: boolean;
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
  onToggle: () => void;
}) {
  const summary = loading
    ? "Getting your local weather…"
    : weather
      ? `${Math.round(weather.temperatureCelsius)}°C, ${weather.description}${
          weather.locationLabel ? ` in ${weather.locationLabel}` : ""
        }`
      : error ?? "Factor in live weather";

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-1 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <CloudSun size={16} className="shrink-0 text-foreground/60" />
        <span className={`truncate ${error && !weather ? "text-red-600" : "text-foreground/70"}`}>
          {summary}
        </span>
      </div>
      <Switch checked={enabled} onChange={onToggle} label="Use live weather" />
    </div>
  );
}
