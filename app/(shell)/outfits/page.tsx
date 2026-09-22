"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/Button";
import { CountStepper } from "@/components/outfits/CountStepper";
import { OutfitCategoryToggles } from "@/components/outfits/OutfitCategoryToggles";
import { OutfitGeneratingView } from "@/components/outfits/OutfitGeneratingView";
import { OutfitModeToggle, type OutfitMode } from "@/components/outfits/OutfitModeToggle";
import { OutfitResultCard } from "@/components/outfits/OutfitResultCard";
import { PackingDayCard } from "@/components/outfits/PackingDayCard";
import { SavedOutfitCard } from "@/components/outfits/SavedOutfitCard";
import { SeasonSelector } from "@/components/outfits/SeasonSelector";
import { StyleSelector } from "@/components/outfits/StyleSelector";
import { TripDateRangeRow } from "@/components/outfits/TripDateRangeRow";
import { TripWeatherRow } from "@/components/outfits/TripWeatherRow";
import { WeatherToggleRow } from "@/components/outfits/WeatherToggleRow";
import { api } from "@/lib/api";
import { generateQuickMatchOutfits, MAX_RESULT_COUNT } from "@/lib/colorMatch";
import { outfitSignature } from "@/lib/outfitSignature";
import { MAX_TRIP_DAYS, tripDateRange } from "@/lib/packingList";
import {
  fetchCurrentWeather,
  fetchTripForecastForCurrentLocation,
  fetchTripForecastForLocation,
  fetchWeatherForLocation,
} from "@/lib/weather";
import type {
  ClothingItem,
  DailyForecast,
  GeneratedOutfit,
  OutfitStyle,
  PackingDayInput,
  PackingDayOutfit,
  SavedOutfit,
  Season,
  WeatherSnapshot,
} from "@/lib/types";
import { OutfitGenerationError } from "@/lib/types";

/// Port of `outfits_screen.dart` — the outfit-generation engines (AI
/// Stylist, Quick Match, Packing List) plus the saved-outfits list
/// beneath them.
export default function OutfitsPage() {
  const [items, setItems] = useState<ClothingItem[] | null>(null);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[] | null>(null);

  const [mode, setMode] = useState<OutfitMode>("quickMatch");
  const [style, setStyle] = useState<OutfitStyle>("casual");
  const [season, setSeason] = useState<Season | null>(null);
  const [includeOuterwear, setIncludeOuterwear] = useState(true);
  const [includeShoes, setIncludeShoes] = useState(true);
  const [count, setCount] = useState(3);

  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Packing List only -- see TripDateRangeRow/TripWeatherRow below.
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [tripStart, setTripStart] = useState(today);
  const [tripEnd, setTripEnd] = useState(today);
  const [tripWeatherEnabled, setTripWeatherEnabled] = useState(true);
  const [tripDestination, setTripDestination] = useState<string | null>(null);
  const [packingResult, setPackingResult] = useState<PackingDayOutfit[] | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generatedOutfits, setGeneratedOutfits] = useState<GeneratedOutfit[] | null>(
    null,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [savedSignatures, setSavedSignatures] = useState<Set<string>>(new Set());

  // Every outfit-item-set shown this session, across BOTH engines --
  // excluded on generation so consecutive (and mode-switching) "Generate"
  // taps keep surfacing fresh combinations instead of repeating. See
  // lib/outfitSignature.ts.
  const [seenSignatures, setSeenSignatures] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.listItems().then(setItems).catch(() => setItems([]));
    api
      .listSavedOutfits()
      .then(setSavedOutfits)
      .catch(() => setSavedOutfits([]));
  }, []);

  const itemsById = useMemo(
    () => new Map((items ?? []).map((item) => [item.id, item])),
    [items],
  );

  async function loadCurrentLocationWeather() {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      setWeather(await fetchCurrentWeather());
    } catch (err) {
      setWeatherError(
        err instanceof Error ? err.message : "Could not fetch weather.",
      );
    } finally {
      setWeatherLoading(false);
    }
  }

  async function searchLocationWeather(query: string) {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      setWeather(await fetchWeatherForLocation(query));
    } catch (err) {
      setWeatherError(
        err instanceof Error ? err.message : "Could not fetch weather.",
      );
    } finally {
      setWeatherLoading(false);
    }
  }

  function toggleWeather() {
    if (weatherEnabled) {
      setWeatherEnabled(false);
      return;
    }
    setWeatherEnabled(true);
    void loadCurrentLocationWeather();
  }

  async function handleGeneratePackingList() {
    const dates = tripDateRange(tripStart, tripEnd);
    if (dates.length === 0) {
      throw new OutfitGenerationError("Pick a valid date range.");
    }
    if (dates.length > MAX_TRIP_DAYS) {
      throw new OutfitGenerationError(`Trips are limited to ${MAX_TRIP_DAYS} days.`);
    }

    // Weather is best-effort for a trip -- if the lookup fails (no
    // permission, unknown place, offline), fall back to season-only
    // hints for every day rather than failing the whole plan.
    let forecastByDate = new Map<string, DailyForecast>();
    if (tripWeatherEnabled) {
      try {
        const forecast = tripDestination
          ? await fetchTripForecastForLocation(tripDestination, dates[0], dates[dates.length - 1])
          : await fetchTripForecastForCurrentLocation(dates[0], dates[dates.length - 1]);
        forecastByDate = new Map(forecast.days.map((day) => [day.date, day]));
      } catch {
        // Ignored -- see comment above.
      }
    }

    const days: PackingDayInput[] = dates.map((date) => ({
      date,
      weather: forecastByDate.get(date) ?? null,
    }));

    const result = await api.generatePackingList({
      style,
      includeOuterwear,
      includeShoes,
      season,
      days,
      excludeCombos: Array.from(seenSignatures, (sig) => sig.split(",")),
    });
    setPackingResult(result);
    setSeenSignatures((prev) => {
      const next = new Set(prev);
      for (const day of result) next.add(outfitSignature(day.outfit.itemIds));
      return next;
    });
  }

  async function handleGenerate() {
    if (!items) return;
    setGenerating(true);
    setGenerateError(null);
    setGeneratedOutfits(null);
    setPackingResult(null);
    try {
      if (mode === "packing") {
        await handleGeneratePackingList();
      } else {
        const outfits =
          mode === "ai"
            ? await api.generateAiOutfits({
                style,
                includeOuterwear,
                includeShoes,
                weather: weatherEnabled ? weather : null,
                season,
                excludeCombos: Array.from(seenSignatures, (sig) => sig.split(",")),
              })
            : generateQuickMatchOutfits({
                items,
                count,
                includeOuterwear,
                includeShoes,
                excludeSignatures: seenSignatures,
              });
        setGeneratedOutfits(outfits);
        setSeenSignatures((prev) => {
          const next = new Set(prev);
          for (const outfit of outfits) next.add(outfitSignature(outfit.itemIds));
          return next;
        });
      }
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Outfit generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveOutfit(outfit: GeneratedOutfit) {
    const signature = outfitSignature(outfit.itemIds);
    try {
      const saved = await api.saveOutfit({ style, season, outfit });
      setSavedOutfits((prev) => [saved, ...(prev ?? [])]);
      setSavedSignatures((prev) => new Set(prev).add(signature));
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Could not save this outfit.",
      );
    }
  }

  async function handleDeleteSaved(id: string) {
    setSavedOutfits((prev) => (prev ?? []).filter((o) => o.id !== id));
    await api.deleteSavedOutfit(id).catch(() => {});
  }

  const noItems = items !== null && items.length === 0;
  const tripDayCount = mode === "packing" ? tripDateRange(tripStart, tripEnd).length : 0;
  const tripInvalid = mode === "packing" && (tripDayCount === 0 || tripDayCount > MAX_TRIP_DAYS);

  return (
    <div className="flex flex-1 flex-col pb-8">
      <SectionHeader title="Outfits" subtitle="Mix and match from your wardrobe" />

      <OutfitModeToggle mode={mode} onChange={setMode} />

      <div className="mt-4 flex flex-col gap-2">
        <StyleSelector value={style} onChange={setStyle} />
        <SeasonSelector value={season} onChange={setSeason} />
        <OutfitCategoryToggles
          includeOuterwear={includeOuterwear}
          includeShoes={includeShoes}
          onChangeOuterwear={setIncludeOuterwear}
          onChangeShoes={setIncludeShoes}
        />
        {mode === "ai" ? (
          <WeatherToggleRow
            enabled={weatherEnabled}
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
            onToggle={toggleWeather}
            onUseCurrentLocation={loadCurrentLocationWeather}
            onSearchLocation={searchLocationWeather}
          />
        ) : mode === "packing" ? (
          <>
            <TripDateRangeRow
              startDate={tripStart}
              endDate={tripEnd}
              maxDays={MAX_TRIP_DAYS}
              onChange={(start, end) => {
                setTripStart(start);
                setTripEnd(end);
              }}
            />
            <TripWeatherRow
              enabled={tripWeatherEnabled}
              destination={tripDestination}
              onToggle={() => setTripWeatherEnabled((v) => !v)}
              onDestinationChange={setTripDestination}
            />
          </>
        ) : (
          <CountStepper value={count} onChange={setCount} max={MAX_RESULT_COUNT} />
        )}
      </div>

      <div className="px-5 py-4">
        <Button
          onClick={handleGenerate}
          disabled={generating || noItems || tripInvalid}
          className="w-full"
        >
          {generating
            ? "Generating…"
            : mode === "ai"
              ? "Ask the AI Stylist"
              : mode === "packing"
                ? "Plan the trip"
                : "Generate outfits"}
        </Button>
        {noItems ? (
          <p className="mt-2 text-center text-xs text-foreground/50">
            Add some wardrobe items first.
          </p>
        ) : null}
      </div>

      {generateError ? (
        <p className="px-5 pb-2 text-sm text-red-600">{generateError}</p>
      ) : null}

      {generating ? (
        <OutfitGeneratingView />
      ) : mode === "packing" && packingResult && packingResult.length > 0 ? (
        <div className="flex flex-col gap-3 px-5 pb-6">
          {packingResult.map((day) => (
            <PackingDayCard
              key={day.date}
              day={day}
              itemsById={itemsById}
              saved={savedSignatures.has(outfitSignature(day.outfit.itemIds))}
              onSave={() => handleSaveOutfit(day.outfit)}
            />
          ))}
        </div>
      ) : generatedOutfits && generatedOutfits.length > 0 ? (
        <div className="flex flex-col gap-3 px-5 pb-6">
          {generatedOutfits.map((outfit, index) => (
            <OutfitResultCard
              key={index}
              outfit={outfit}
              itemsById={itemsById}
              saved={savedSignatures.has(outfitSignature(outfit.itemIds))}
              onSave={() => handleSaveOutfit(outfit)}
            />
          ))}
        </div>
      ) : null}

      <SectionHeader title="Saved outfits" />
      {savedOutfits === null ? (
        <p className="px-5 pb-8 text-sm text-foreground/50">Loading…</p>
      ) : savedOutfits.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={40} strokeWidth={1.25} />}
          title="No saved outfits yet"
          message="Generate an outfit above and save the ones you like."
        />
      ) : (
        <div className="flex flex-col gap-3 px-5 pb-8">
          {savedOutfits.map((outfit) => (
            <SavedOutfitCard
              key={outfit.id}
              outfit={outfit}
              itemsById={itemsById}
              onDelete={() => handleDeleteSaved(outfit.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
