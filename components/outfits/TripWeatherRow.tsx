"use client";

import { CloudSun, MapPin, Search } from "lucide-react";
import { useState } from "react";

import { Switch } from "@/components/ui/Switch";

/// Packing List's weather control. Unlike WeatherToggleRow (a single live
/// snapshot for "right now"), this just captures where the trip is to --
/// null means the browser's current location -- since the actual per-day
/// forecast can only be fetched once the date range is known, together
/// with generation (see outfits/page.tsx's handleGenerate).
export function TripWeatherRow({
  enabled,
  destination,
  onToggle,
  onDestinationChange,
}: {
  enabled: boolean;
  destination: string | null;
  onToggle: () => void;
  onDestinationChange: (destination: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState(destination ?? "");

  function submit() {
    const trimmed = query.trim();
    onDestinationChange(trimmed || null);
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-1.5 px-5 py-1 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-foreground/70">
          <CloudSun size={16} className="shrink-0 text-foreground/60" />
          <span className="truncate">
            {enabled ? (destination ?? "Current location") : "Factor in the forecast"}
          </span>
        </div>
        <Switch checked={enabled} onChange={onToggle} label="Use weather forecast" />
      </div>

      {enabled ? (
        editing ? (
          <div className="flex gap-2 pl-6">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="City or place name"
              className="min-w-0 flex-1 rounded-lg border border-outline bg-surface px-2.5 py-1 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={submit}
              aria-label="Set destination"
              className="flex items-center justify-center rounded-lg border border-outline px-2 text-foreground/70 hover:bg-outline/30"
            >
              <Search size={14} />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-4 pl-6 text-xs">
            <button
              onClick={() => onDestinationChange(null)}
              className="flex items-center gap-1 text-accent hover:underline"
            >
              <MapPin size={12} /> Use current location
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-accent hover:underline"
            >
              <Search size={12} /> Enter destination
            </button>
          </div>
        )
      ) : null}
    </div>
  );
}
