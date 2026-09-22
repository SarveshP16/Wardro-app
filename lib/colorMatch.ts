import { hybridScore, describe } from "./colorHarmony";
import { CATEGORY_LABELS } from "./labels";
import { outfitSignature } from "./outfitSignature";
import { ClothingItem, GeneratedOutfit, OutfitGenerationError } from "./types";

/// Port of `color_match_outfit_generation_service.dart` — free, fully
/// offline outfit generation: ranks top+bottom(+outerwear)(+shoes)
/// combinations from the user's own wardrobe purely by color harmony, no
/// network call, no occasion awareness (that's what the paid AI Stylist
/// adds). Runs entirely client-side.

const FALLBACK_NEUTRAL = 0x9e9e9e;
const MAX_COMBOS_EVALUATED = 2000;
export const MAX_RESULT_COUNT = 8;

interface ScoredCombo {
  items: ClothingItem[];
  score: number;
  title: string;
  rationale: string;
}

export interface QuickMatchOptions {
  items: ClothingItem[];
  count?: number;
  includeOuterwear?: boolean;
  includeShoes?: boolean;
  /// Signatures (sorted item ids, joined by ",") already shown this
  /// session -- avoided on a first pass so consecutive "Generate" taps
  /// keep surfacing fresh combinations. Owned by the caller (see
  /// outfits/page.tsx's `seenSignatures`) rather than this module, so the
  /// same "never repeat" tracking can span both generation engines.
  excludeSignatures?: ReadonlySet<string>;
}

function scoreCombo(
  top: ClothingItem,
  bottom: ClothingItem,
  outer: ClothingItem | null,
  shoe: ClothingItem | null,
): ScoredCombo {
  const items = [top, bottom, ...(outer ? [outer] : []), ...(shoe ? [shoe] : [])];
  const colors = items.map((i) => i.dominantColor ?? FALLBACK_NEUTRAL);

  let total = 0;
  let pairs = 0;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      total += hybridScore(colors[i], colors[j]);
      pairs++;
    }
  }
  const score = pairs === 0 ? 0 : total / pairs;

  const title = describe(
    top.dominantColor ?? FALLBACK_NEUTRAL,
    bottom.dominantColor ?? FALLBACK_NEUTRAL,
  );
  const pieces = [
    CATEGORY_LABELS[top.category],
    CATEGORY_LABELS[bottom.category],
    outer ? CATEGORY_LABELS[outer.category] : null,
    shoe ? CATEGORY_LABELS[shoe.category] : null,
  ]
    .filter((label): label is string => label !== null)
    .join(" + ");

  return {
    items,
    score,
    title,
    rationale: `Quick Match paired these by color: ${pieces}.`,
  };
}

export function generateQuickMatchOutfits(
  options: QuickMatchOptions,
): GeneratedOutfit[] {
  const {
    items,
    count = 3,
    includeOuterwear = true,
    includeShoes = true,
    excludeSignatures,
  } = options;

  const tops = items.filter((i) => i.category === "top");
  const bottoms = items.filter((i) => i.category === "bottom");
  const outerwear = includeOuterwear
    ? items.filter((i) => i.category === "outerwear")
    : [];
  const shoes = includeShoes ? items.filter((i) => i.category === "shoes") : [];

  if (tops.length === 0 || bottoms.length === 0) {
    throw new OutfitGenerationError(
      "Add at least one top and one bottom to use Quick Match.",
    );
  }

  const outerwearOptions: (ClothingItem | null)[] = [null, ...outerwear];
  const shoeOptions: (ClothingItem | null)[] = [null, ...shoes];
  const totalCombos =
    tops.length * bottoms.length * outerwearOptions.length * shoeOptions.length;

  const combos: ScoredCombo[] = [];
  if (totalCombos <= MAX_COMBOS_EVALUATED) {
    for (const top of tops) {
      for (const bottom of bottoms) {
        for (const outer of outerwearOptions) {
          for (const shoe of shoeOptions) {
            combos.push(scoreCombo(top, bottom, outer, shoe));
          }
        }
      }
    }
  } else {
    // Wardrobe is large enough that full enumeration isn't worth it --
    // random-sample the combination space instead of scoring all of it.
    for (let i = 0; i < MAX_COMBOS_EVALUATED; i++) {
      combos.push(
        scoreCombo(
          tops[Math.floor(Math.random() * tops.length)],
          bottoms[Math.floor(Math.random() * bottoms.length)],
          outerwearOptions[Math.floor(Math.random() * outerwearOptions.length)],
          shoeOptions[Math.floor(Math.random() * shoeOptions.length)],
        ),
      );
    }
  }

  combos.sort((a, b) => b.score - a.score);

  const resultCount = Math.min(Math.max(count, 1), MAX_RESULT_COUNT);
  const chosen: ScoredCombo[] = [];
  const chosenSignatures = new Set<string>();

  // First pass: best-scoring combos not already seen this session. Second
  // pass (only if the wardrobe is too small to fill the request without
  // repeats): allow repeats rather than returning fewer than asked.
  for (const avoidSeen of [true, false]) {
    if (chosen.length === resultCount) break;
    for (const combo of combos) {
      if (chosen.length === resultCount) break;
      const signature = outfitSignature(combo.items.map((i) => i.id));
      if (chosenSignatures.has(signature)) continue;
      if (avoidSeen && excludeSignatures?.has(signature)) continue;
      chosenSignatures.add(signature);
      chosen.push(combo);
    }
  }

  if (chosen.length === 0) {
    throw new OutfitGenerationError(
      "Could not put together an outfit from these items.",
    );
  }
  return chosen.map((combo) => ({
    title: combo.title,
    rationale: combo.rationale,
    itemIds: combo.items.map((i) => i.id),
  }));
}
