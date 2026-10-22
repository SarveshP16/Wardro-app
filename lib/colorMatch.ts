import { ROLE_OF, rolesOf, type OutfitRole } from "./categories";
import { hybridScore, describe } from "./colorHarmony";
import { CATEGORY_LABELS } from "./labels";
import { outfitSignature } from "./outfitSignature";
import { ClothingItem, GeneratedOutfit, OutfitGenerationError } from "./types";

/// Quick Match -- free, fully offline outfit generation: ranks
/// combinations from the user's own wardrobe purely by color harmony, no
/// network call, no occasion awareness (that's what the paid AI Stylist
/// adds). Runs entirely client-side.
///
/// An outfit is a top + a bottom, or a one-piece (dress, jumpsuit) on its
/// own, plus optionally outerwear and shoes (see lib/categories.ts). A
/// piece with several categories can fill any of their roles, but never
/// two in the same outfit.

const FALLBACK_NEUTRAL = 0x9e9e9e;
/// A dress or jumpsuit worn on its own has no color pairs to score, but
/// it's harmonious with itself -- rate it like pairing with a neutral, so
/// it competes with other outfits instead of always ranking last.
const LONE_PIECE_SCORE = 0.85;
const MAX_COMBOS_EVALUATED = 2000;
export const MAX_RESULT_COUNT = 8;

/// A piece and the role it plays in a combination.
type Placed = { item: ClothingItem; role: OutfitRole };

interface ScoredCombo {
  pieces: Placed[];
  score: number;
  title: string;
  rationale: string;
}

interface QuickMatchOptions {
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

/// "Dress", "Skirt", "Top"... -- the piece's category that matches the
/// role it's playing.
function roleLabel({ item, role }: Placed): string {
  const category = item.categories.find((c) => ROLE_OF[c] === role);
  return category ? CATEGORY_LABELS[category] : role;
}

function scoreCombo(pieces: Placed[]): ScoredCombo {
  const colors = pieces.map((p) => p.item.dominantColor ?? FALLBACK_NEUTRAL);

  let total = 0;
  let pairs = 0;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      total += hybridScore(colors[i], colors[j]);
      pairs++;
    }
  }
  const score = pairs === 0 ? LONE_PIECE_SCORE : total / pairs;

  // Titled after the two main pieces (a one-piece pairs with whatever
  // comes next -- outerwear or shoes -- or with itself).
  const title = describe(colors[0], colors[1] ?? colors[0]);
  return {
    pieces,
    score,
    title,
    rationale: `Quick Match paired these by color: ${pieces.map(roleLabel).join(" + ")}.`,
  };
}

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

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

  const withRole = (role: OutfitRole) =>
    items.filter((i) => rolesOf(i).includes(role));
  const tops = withRole("top");
  const bottoms = withRole("bottom");
  const onePieces = withRole("onepiece");
  const outerwear = includeOuterwear ? withRole("outerwear") : [];
  const shoes = includeShoes ? withRole("shoes") : [];

  // The core of every outfit: a top + a bottom, or a one-piece.
  const bases: Placed[][] = [];
  for (const top of tops) {
    for (const bottom of bottoms) {
      if (top.id !== bottom.id) {
        bases.push([{ item: top, role: "top" }, { item: bottom, role: "bottom" }]);
      }
    }
  }
  for (const onePiece of onePieces) bases.push([{ item: onePiece, role: "onepiece" }]);

  if (bases.length === 0) {
    throw new OutfitGenerationError(
      "Add a top and a bottom, or a dress or jumpsuit, to use Quick Match.",
    );
  }

  /// Outerwear/shoes options for a base: none, or any piece not already in it.
  const extras = (base: Placed[], list: ClothingItem[]) => [
    null,
    ...list.filter((item) => !base.some((p) => p.item.id === item.id)),
  ];
  const withExtras = (
    base: Placed[],
    outer: ClothingItem | null,
    shoe: ClothingItem | null,
  ): Placed[] => [
    ...base,
    ...(outer ? [{ item: outer, role: "outerwear" as const }] : []),
    ...(shoe && shoe.id !== outer?.id ? [{ item: shoe, role: "shoes" as const }] : []),
  ];

  const totalCombos = bases.length * (outerwear.length + 1) * (shoes.length + 1);
  const combos: ScoredCombo[] = [];
  if (totalCombos <= MAX_COMBOS_EVALUATED) {
    for (const base of bases) {
      for (const outer of extras(base, outerwear)) {
        for (const shoe of extras(base, shoes)) {
          if (shoe && shoe.id === outer?.id) continue;
          combos.push(scoreCombo(withExtras(base, outer, shoe)));
        }
      }
    }
  } else {
    // Wardrobe is large enough that full enumeration isn't worth it --
    // random-sample the combination space instead of scoring all of it.
    for (let i = 0; i < MAX_COMBOS_EVALUATED; i++) {
      const base = pick(bases);
      combos.push(
        scoreCombo(withExtras(base, pick(extras(base, outerwear)), pick(extras(base, shoes)))),
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
      const signature = outfitSignature(combo.pieces.map((p) => p.item.id));
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
    itemIds: combo.pieces.map((p) => p.item.id),
  }));
}
