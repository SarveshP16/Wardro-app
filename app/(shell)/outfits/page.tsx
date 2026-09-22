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
import { SavedOutfitCard } from "@/components/outfits/SavedOutfitCard";
import { SeasonSelector } from "@/components/outfits/SeasonSelector";
import { StyleSelector } from "@/components/outfits/StyleSelector";
import { WeatherToggleRow } from "@/components/outfits/WeatherToggleRow";
import { api } from "@/lib/api";
import { generateQuickMatchOutfits, MAX_RESULT_COUNT } from "@/lib/colorMatch";
import { outfitSignature } from "@/lib/outfitSignature";
import { fetchCurrentWeather, fetchWeatherForLocation } from "@/lib/weather";
import type {
  ClothingItem,
  GeneratedOutfit,
  OutfitStyle,
  SavedOutfit,
  Season,
  WeatherSnapshot,
} from "@/lib/types";

/// Port of `outfits_screen.dart` — the two outfit-generation engines
/// (AI Stylist, Quick Match) plus the saved-outfits list beneath them.
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

  async function handleGenerate() {
    if (!items) return;
    setGenerating(true);
    setGenerateError(null);
    setGeneratedOutfits(null);
    try {
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
        ) : (
          <CountStepper value={count} onChange={setCount} max={MAX_RESULT_COUNT} />
        )}
      </div>

      <div className="px-5 py-4">
        <Button
          onClick={handleGenerate}
          disabled={generating || noItems}
          className="w-full"
        >
          {generating
            ? "Generating…"
            : mode === "ai"
              ? "Ask the AI Stylist"
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
