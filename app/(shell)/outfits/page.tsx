"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { Segmented } from "@/components/ui/Segmented";
import { Tabs } from "@/components/ui/Tabs";
import { CountStepper } from "@/components/outfits/CountStepper";
import { OutfitCategoryToggles } from "@/components/outfits/OutfitCategoryToggles";
import { OutfitGeneratingView } from "@/components/outfits/OutfitGeneratingView";
import { OutfitResultCard } from "@/components/outfits/OutfitResultCard";
import { PackingPlan } from "@/components/outfits/PackingPlan";
import { SavedOutfitCard } from "@/components/outfits/SavedOutfitCard";
import { TripDateRangeRow } from "@/components/outfits/TripDateRangeRow";
import { TripWeatherRow } from "@/components/outfits/TripWeatherRow";
import { WeatherToggleRow } from "@/components/outfits/WeatherToggleRow";
import { api } from "@/lib/api";
import { generateQuickMatchOutfits, MAX_RESULT_COUNT } from "@/lib/colorMatch";
import {
  COLOR_SCHEMES,
  generateSchemeOutfits,
  SCHEME_HINTS,
  SCHEME_LABELS,
  type ColorScheme,
} from "@/lib/colorSchemes";
import { SEASON_LABELS, STYLE_LABELS } from "@/lib/labels";
import { outfitSignature } from "@/lib/outfitSignature";
import { localToday, MAX_TRIP_DAYS, tripDateRange } from "@/lib/packingList";
import { SEASON_ICONS } from "@/lib/seasonIcons";
import {
  fetchCurrentWeather,
  fetchTripForecastForCurrentLocation,
  fetchTripForecastForLocation,
  fetchWeatherForLocation,
} from "@/lib/weather";
import {
  OUTFIT_STYLES,
  SEASONS,
  type ClothingItem,
  type DailyForecast,
  type GeneratedOutfit,
  type OutfitStyle,
  type PackingDayInput,
  type PackingDayOutfit,
  type SavedOutfit,
  type Season,
  type WeatherSnapshot,
} from "@/lib/types";
import { OutfitGenerationError } from "@/lib/types";

/// The three outfit engines: the free, offline Quick Match colour
/// matcher, the AI Stylist, and Packing List (also AI Stylist-backed --
/// see lib/anthropic.ts's generateAiPackingList -- but planning a whole
/// trip in one call).
type OutfitMode = "quickMatch" | "ai" | "packing";

const MODE_OPTIONS: { value: OutfitMode; label: string }[] = [
  { value: "quickMatch", label: "Quick match" },
  { value: "ai", label: "AI stylist" },
  { value: "packing", label: "Packing" },
];

const GENERATE_LABELS: Record<OutfitMode, string> = {
  quickMatch: "Generate outfits",
  ai: "Ask the AI stylist",
  packing: "Plan the trip",
};

type View = "create" | "saved";

/// The Outfits tab: Create (pick an engine and options, generate, save
/// what you like) and Saved.
export default function OutfitsPage() {
  const [view, setView] = useState<View>("create");
  const [items, setItems] = useState<ClothingItem[] | null>(null);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[] | null>(null);

  const [mode, setMode] = useState<OutfitMode>("quickMatch");
  const [style, setStyle] = useState<OutfitStyle>("casual");
  const [season, setSeason] = useState<Season | null>(null);
  const [includeOuterwear, setIncludeOuterwear] = useState(true);
  const [includeShoes, setIncludeShoes] = useState(true);
  const [count, setCount] = useState(3);
  // Quick Match only: Classic is the original matcher (lib/colorMatch.ts);
  // the others are lib/colorSchemes.ts.
  const [scheme, setScheme] = useState<ColorScheme>("classic");
  // The options panel folds down to a one-line summary once there are
  // results, so they get the screen.
  const [optionsOpen, setOptionsOpen] = useState(true);

  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Packing List only -- see TripDateRangeRow/TripWeatherRow below.
  const today = useMemo(() => localToday(), []);
  const [tripStart, setTripStart] = useState(today);
  const [tripEnd, setTripEnd] = useState(today);
  const [tripWeatherEnabled, setTripWeatherEnabled] = useState(true);
  const [tripDestination, setTripDestination] = useState<string | null>(null);
  // Distinct outfits for the trip (re-worn); null = one per day.
  const [tripOutfits, setTripOutfits] = useState<number | null>(null);
  const [packingResult, setPackingResult] = useState<PackingDayOutfit[] | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generatedOutfits, setGeneratedOutfits] = useState<GeneratedOutfit[] | null>(
    null,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [savedSignatures, setSavedSignatures] = useState<Set<string>>(new Set());

  // Every outfit-item-set shown this session, across ALL engines --
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
      outfitCount: Math.min(tripOutfits ?? days.length, days.length),
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
            : scheme === "classic"
              ? generateQuickMatchOutfits({
                  items,
                  count,
                  includeOuterwear,
                  includeShoes,
                  excludeSignatures: seenSignatures,
                })
              : generateSchemeOutfits({
                  items,
                  scheme,
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
      setOptionsOpen(false);
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
  const tripOutfitCount = Math.max(1, Math.min(tripOutfits ?? tripDayCount, tripDayCount));
  const hasResults =
    (mode === "packing" ? packingResult?.length : generatedOutfits?.length) ?? 0;

  const summary = [
    MODE_OPTIONS.find((m) => m.value === mode)!.label,
    mode === "quickMatch" && scheme !== "classic" ? SCHEME_LABELS[scheme] : null,
    STYLE_LABELS[style],
    season ? SEASON_LABELS[season] : null,
    mode === "ai" && weatherEnabled && weather
      ? `${Math.round(weather.temperatureCelsius)}°C`
      : null,
    mode === "packing" ? `${tripDayCount} day${tripDayCount === 1 ? "" : "s"}` : null,
    mode === "packing" && tripOutfitCount < tripDayCount
      ? `${tripOutfitCount} outfit${tripOutfitCount === 1 ? "" : "s"}`
      : null,
  ].filter((part): part is string => part !== null);

  return (
    <div className="flex flex-1 flex-col pb-10">
      <PageHeader title="Outfits" />

      <Tabs<View>
        label="Outfits"
        value={view}
        onChange={setView}
        items={[
          { value: "create", label: "Create" },
          { value: "saved", label: "Saved", count: savedOutfits?.length },
        ]}
      />

      {view === "create" ? (
        <div className="flex flex-col">
          {optionsOpen || !hasResults ? (
            <section aria-label="Outfit options" className="flex flex-col gap-5 px-5 pt-5">
              <Segmented
                label="Outfit engine"
                value={mode}
                onChange={setMode}
                options={MODE_OPTIONS}
              />

              {mode === "quickMatch" ? (
                <OptionGroup label="Colour matching">
                  <ChoiceChips<ColorScheme>
                    label="Colour matching"
                    value={scheme}
                    onChange={setScheme}
                    options={COLOR_SCHEMES.map((s) => ({ value: s, label: SCHEME_LABELS[s] }))}
                  />
                  <p className="text-xs text-muted">{SCHEME_HINTS[scheme]}</p>
                </OptionGroup>
              ) : null}

              <OptionGroup label="Occasion">
                <ChoiceChips<OutfitStyle>
                  label="Occasion"
                  value={style}
                  onChange={setStyle}
                  options={OUTFIT_STYLES.map((s) => ({ value: s, label: STYLE_LABELS[s] }))}
                />
              </OptionGroup>

              <OptionGroup label="Season">
                <ChoiceChips<Season | null>
                  label="Season"
                  value={season}
                  onChange={setSeason}
                  options={[
                    { value: null, label: "Any" },
                    ...SEASONS.map((s) => ({
                      value: s,
                      label: SEASON_LABELS[s],
                      icon: SEASON_ICONS[s],
                    })),
                  ]}
                />
              </OptionGroup>

              <div className="flex flex-col gap-2 border-y border-line py-3">
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
                    {tripDayCount > 1 && !tripInvalid ? (
                      <CountStepper
                        label="Outfits"
                        hint={
                          tripOutfitCount < tripDayCount
                            ? `${tripOutfitCount} for ${tripDayCount} days, re-worn — pack lighter`
                            : "One for each day"
                        }
                        value={tripOutfitCount}
                        onChange={setTripOutfits}
                        max={tripDayCount}
                      />
                    ) : null}
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
            </section>
          ) : (
            <div className="flex items-center gap-2 px-5 pt-4">
              <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                {summary.map((part) => (
                  <span
                    key={part}
                    className="shrink-0 rounded-chip border border-line bg-surface px-2.5 py-1 text-[12.5px]"
                  >
                    {part}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOptionsOpen(true)}
                className="shrink-0 text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
              >
                Edit
              </button>
            </div>
          )}

          <div className="px-5 pb-2 pt-5">
            <Button
              onClick={handleGenerate}
              disabled={generating || noItems || tripInvalid || items === null}
              icon={<Sparkles size={16} />}
              className="w-full md:w-auto"
            >
              {generating
                ? "Generating…"
                : hasResults
                  ? "Show different outfits"
                  : GENERATE_LABELS[mode]}
            </Button>
            {noItems ? (
              <p className="mt-2 text-xs text-muted">
                Add some pieces to your wardrobe first.
              </p>
            ) : null}
          </div>

          {generateError ? (
            <p role="alert" className="px-5 pt-2 text-sm text-danger">
              {generateError}
            </p>
          ) : null}

          {generating ? (
            <OutfitGeneratingView />
          ) : mode === "packing" && packingResult && packingResult.length > 0 ? (
            <PackingPlan
              days={packingResult}
              itemsById={itemsById}
              savedSignatures={savedSignatures}
              onSave={handleSaveOutfit}
            />
          ) : mode !== "packing" && generatedOutfits && generatedOutfits.length > 0 ? (
            <ResultGrid>
              {generatedOutfits.map((outfit, index) => (
                <OutfitResultCard
                  key={index}
                  outfit={outfit}
                  itemsById={itemsById}
                  saved={savedSignatures.has(outfitSignature(outfit.itemIds))}
                  onSave={() => handleSaveOutfit(outfit)}
                />
              ))}
            </ResultGrid>
          ) : null}
        </div>
      ) : savedOutfits === null ? (
        <p className="px-5 py-10 text-center text-sm text-muted">Loading…</p>
      ) : savedOutfits.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={36} strokeWidth={1.25} />}
          title="No saved outfits yet"
          message="Outfits you save from Create show up here."
          action={<Button onClick={() => setView("create")}>Create an outfit</Button>}
        />
      ) : (
        <ResultGrid>
          {savedOutfits.map((outfit) => (
            <SavedOutfitCard
              key={outfit.id}
              outfit={outfit}
              itemsById={itemsById}
              onDelete={() => handleDeleteSaved(outfit.id)}
            />
          ))}
        </ResultGrid>
      )}
    </div>
  );
}

function OptionGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold">{label}</p>
      {children}
    </div>
  );
}

/// Outfit cards: one column on phones, two side by side on wider screens.
function ResultGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-x-8 gap-y-10 px-5 pt-6 md:grid-cols-2">{children}</div>
  );
}
