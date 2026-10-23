"use client";

import { MapPin } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { searchPlaces } from "@/lib/weather";
import type { Place } from "@/lib/types";

/// A place search box that suggests matching places as you type (see
/// lib/weather.ts's searchPlaces) -- picking one keeps its exact
/// coordinates, so "Gold Coast, Queensland" never turns into a namesake.
export function PlaceSearch({
  placeholder = "City or place name",
  onPick,
  onCancel,
}: {
  placeholder?: string;
  onPick: (place: Place) => void;
  onCancel: () => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  // Results for the query they were fetched for; null places = failed.
  const [found, setFound] = useState<{ query: string; places: Place[] | null }>({
    query: "",
    places: [],
  });
  const [active, setActive] = useState(0);

  const trimmed = query.trim();
  const searching = trimmed.length >= 2 && found.query !== trimmed;
  const places = found.query === trimmed ? (found.places ?? []) : [];

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    // Wait for a pause in typing before searching.
    const timer = setTimeout(() => {
      searchPlaces(trimmed, controller.signal)
        .then((result) => {
          setFound({ query: trimmed, places: result });
          setActive(0);
        })
        .catch(() => {
          if (!controller.signal.aborted) setFound({ query: trimmed, places: null });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const status = searching
    ? "Searching…"
    : found.query === trimmed && found.places === null
      ? "Couldn't search right now — check your connection."
      : trimmed.length >= 2 && places.length === 0
        ? `No places found for "${trimmed}".`
        : null;

  return (
    <div className="flex flex-col gap-1.5 pl-6">
      <div className="flex gap-2">
        <input
          autoFocus
          role="combobox"
          aria-expanded={places.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, places.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && places[active]) {
              onPick(places[active]);
            } else if (e.key === "Escape") {
              onCancel();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-control border border-line bg-surface px-2.5 py-1 text-sm outline-none focus:border-primary"
        />
        <button onClick={onCancel} className="text-xs text-muted hover:text-ink">
          Cancel
        </button>
      </div>

      {places.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching places"
          className="overflow-hidden rounded-control border border-line bg-surface"
        >
          {places.map((place, i) => (
            <li key={`${place.id}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onClick={() => onPick(place)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-start gap-2 px-2.5 py-2 text-left text-sm ${
                  i === active ? "bg-surface-2" : ""
                }`}
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-muted" />
                <span className="min-w-0">
                  <span className="text-ink">{place.name}</span>
                  {place.region ? (
                    <span className="block truncate text-xs text-muted">{place.region}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : status ? (
        <p className="text-xs text-muted">{status}</p>
      ) : null}
    </div>
  );
}
