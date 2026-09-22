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
import { StyleSelector } from "@/components/outfits/StyleSelector";
import { WeatherToggleRow } from "@/components/outfits/WeatherToggleRow";
import { api } from "@/lib/api";
import { ColorMatchGenerator, MAX_RESULT_COUNT } from "@/lib/colorMatch";
import { fetchCurrentWeather } from "@/lib/weather";
import type {
  ClothingItem,
  GeneratedOutfit,
  OutfitStyle,
  SavedOutfit,
  WeatherSnapshot,
} from "@/lib/types";

/// Port of `outfits_screen.dart` — the two outfit-generation engines
/// (AI Stylist, Quick Match) plus the saved-outfits list beneath them.
export default function OutfitsPage() {
  const [items, setItems] = useState<ClothingItem[] | null>(null);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[] | null>(null);

  const [mode, setMode] = useState<OutfitMode>("quickMatch");
  const [style, setStyle] = useState<OutfitStyle>("casual");
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

  // Session-scoped, like the Dart ColorMatchOutfitGenerationService
  // instance -- avoids repeating the previous batch across consecutive
  // "Generate" taps. Lazy useState initializer (rather than a ref) so it's
  // constructed exactly once without touching ref.current during render.
  const [quickMatch] = useState(() => new ColorMatchGenerator());

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

  async function toggleWeather() {
    if (weatherEnabled) {
      setWeatherEnabled(false);
      return;
    }
    setWeatherEnabled(true);
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      setWeather(await fetchCurrentWeather());
    } catch (err) {
      setWeatherError(
        err instanceof Error ? err.message : "Could not fetch weather.",
      );
      setWeatherEnabled(false);
    } finally {
      setWeatherLoading(false);
    }
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
            })
          : quickMatch.generate({
              items,
              count,
              includeOuterwear,
              includeShoes,
            });
      setGeneratedOutfits(outfits);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Outfit generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveOutfit(outfit: GeneratedOutfit) {
    const signature = outfit.itemIds.join(",");
    try {
      const saved = await api.saveOutfit({ style, outfit });
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
              saved={savedSignatures.has(outfit.itemIds.join(","))}
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
