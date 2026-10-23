import rawPalette from "@/data/sanzo_wada_colors.json";

import { ROLE_OF, rolesOf, type OutfitRole } from "./categories";
import { colorName } from "./colorNames";
import { CATEGORY_LABELS } from "./labels";
import { deltaE, hueGap, labToLch, packedToLab, type Lab, type Lch } from "./oklab";
import { outfitSignature } from "./outfitSignature";
import { ClothingItem, GeneratedOutfit, OutfitGenerationError } from "./types";

/// Quick Match's colour schemes -- the alternatives to Classic (which stays
/// in lib/colorMatch.ts, unchanged). Each scheme looks for a different kind
/// of outfit, judged in the perceptual OKLCH space from each piece's
/// palette (up to 3 colours, so prints keep their colours -- see
/// lib/palette.ts), with the same outfit rules on top: enough light/dark
/// contrast, at most one statement piece, prints picked up by solids.
/// Runs client-side, fully offline.

export type ColorScheme =
  | "classic"
  | "tonal"
  | "analogous"
  | "complementary"
  | "accent"
  | "wada"
  | "mix";

export const COLOR_SCHEMES: ColorScheme[] = [
  "classic",
  "tonal",
  "analogous",
  "complementary",
  "accent",
  "wada",
  "mix",
];

export const SCHEME_LABELS: Record<ColorScheme, string> = {
  classic: "Classic",
  tonal: "Tonal",
  analogous: "Analogous",
  complementary: "Complementary",
  accent: "Neutral + accent",
  wada: "Wada palettes",
  mix: "Surprise me",
};

export const SCHEME_HINTS: Record<ColorScheme, string> = {
  classic: "The original colour-harmony match.",
  tonal: "Shades of one colour, light to dark.",
  analogous: "Neighbouring colours, like rust and mustard.",
  complementary: "Opposite colours that make each other stand out.",
  accent: "Neutrals with one piece of colour.",
  wada: "Whole outfits from Sanzo Wada's published colour combinations.",
  mix: "One outfit from each scheme.",
};

type ActiveScheme = Exclude<ColorScheme, "classic" | "mix">;
const MIX_ORDER: ActiveScheme[] = ["complementary", "accent", "tonal", "analogous", "wada"];

const MAX_COMBOS_EVALUATED = 3000;
const MIN_SCORE = 0.35;
const FALLBACK_NEUTRAL = 0x9e9e9e;

// Chroma thresholds are calibrated on real garment photos, which are far
// less saturated than the theory's swatches: a rust shirt measures ~0.09,
// navy jeans ~0.07, a plum or forest-green knit ~0.035.
/// Below this chroma a colour is a true neutral (black, white, grey, stone).
const NEUTRAL_C = 0.02;
/// Pieces need at least this much colour for their hue to count in a
/// hue-based scheme, and one piece in such an outfit needs HERO_C.
const TINTED_C = 0.02;
const HERO_C = 0.035;
/// At or above this chroma a solid colour is a statement.
const LOUD_C = 0.07;
/// Colours this close count as "the same colour" for picking up a print.
const PICK_UP_DELTA = 0.1;
/// How close a piece's colour must be to a Wada colour to count as it
/// (see wadaDistance).
const WADA_DELTA = 0.07;

/* ------------------------------ pieces ------------------------------ */

interface Swatch {
  color: number;
  weight: number;
  lab: Lab;
  lch: Lch;
}

interface Piece {
  item: ClothingItem;
  role: OutfitRole;
  swatches: Swatch[];
  main: Swatch;
  /// True neutral: black, white, grey, stone...
  neutral: boolean;
  /// Reads as a neutral in an outfit: true neutrals plus navy/denim and
  /// khaki/beige/olive in low chroma.
  quiet: boolean;
  /// Two or more clearly different colours (incl. black-and-white).
  pattern: boolean;
  /// A pattern with colour in it.
  print: boolean;
  /// A statement: a strong colour or a print.
  loud: boolean;
  /// Weighted lightness, 0..1.
  lightness: number;
}

function swatchesOf(item: ClothingItem): Swatch[] {
  const palette =
    item.palette && item.palette.length > 0
      ? item.palette
      : [{ color: item.dominantColor ?? FALLBACK_NEUTRAL, weight: 1 }];
  return palette.map(({ color, weight }) => {
    const lab = packedToLab(color);
    return { color, weight, lab, lch: labToLch(lab) };
  });
}

/// A neutral colour as photographed: greys, plus near-whites and
/// near-blacks, which pick up a tint from the light (white sneakers in
/// shade read faintly blue).
function isNeutralColour({ L, C }: Lch): boolean {
  return C < NEUTRAL_C || (L > 0.72 && C < 0.045) || (L < 0.2 && C < 0.04);
}

function softNeutral({ L, C, h }: Lch): boolean {
  const navyOrDenim = h >= 200 && h <= 290 && C < 0.08 && L < 0.62;
  const khakiOrOlive = h >= 50 && h <= 115 && C < 0.06;
  return navyOrDenim || khakiOrOlive;
}

const analysed = new WeakMap<ClothingItem, Omit<Piece, "role">>();

function analyse(item: ClothingItem, role: OutfitRole): Piece {
  let info = analysed.get(item);
  if (!info) {
    const swatches = swatchesOf(item);
    const main = swatches[0];
    const strong = swatches.filter((s) => s.weight >= 0.2);
    // Shoes always look two-tone in a photo (soles, laces) -- treat them as
    // solid rather than as a pattern.
    const shoesOnly = item.categories.every((c) => c === "shoes");
    const pattern =
      !shoesOnly &&
      strong.some((a, i) => strong.some((b, j) => j > i && deltaE(a.lab, b.lab) >= 0.15));
    const print = pattern && strong.some((s) => !isNeutralColour(s.lch));
    const neutral = isNeutralColour(main.lch) && !strong.some((s) => s.lch.C >= LOUD_C);
    const quiet = !print && (neutral || softNeutral(main.lch));
    info = {
      item,
      swatches,
      main,
      neutral,
      quiet,
      pattern,
      print,
      loud: !quiet && (print || main.lch.C >= LOUD_C),
      lightness: swatches.reduce((sum, s) => sum + s.lab.L * s.weight, 0),
    };
    analysed.set(item, info);
  }
  return { ...info, role };
}

/// "rust", "navy"... for a swatch.
const nameOf = (s: Swatch) => colorName(s.color);

/// "top", "dress"... -- the piece's category for the role it plays.
function pieceLabel(piece: Piece): string {
  const category = piece.item.categories.find((c) => ROLE_OF[c] === piece.role);
  return (category ? CATEGORY_LABELS[category] : piece.role).toLowerCase();
}

/// "the top's" / "the shoes'".
const possessive = (label: string) => (label.endsWith("s") ? `${label}'` : `${label}'s`);
/// "carries" / "carry".
const verb = (label: string, singular: string, plural: string) =>
  label.endsWith("s") ? plural : singular;

/* ---------------------------- Wada data ----------------------------- */

interface WadaColour {
  name: string;
  lab: Lab;
}

const WADA_COLOURS: WadaColour[] = [];
/// Combination id -> indices into WADA_COLOURS.
const WADA_COMBOS = new Map<number, number[]>();
/// Colour index -> combination ids it appears in.
const WADA_COMBOS_OF: number[][] = [];
for (const [index, entry] of (rawPalette as { name: string; rgb: number[]; combinations: number[] }[]).entries()) {
  const [r, g, b] = entry.rgb;
  WADA_COLOURS.push({ name: entry.name, lab: packedToLab((r << 16) | (g << 8) | b) });
  WADA_COMBOS_OF[index] = entry.combinations;
  for (const id of entry.combinations) {
    WADA_COMBOS.set(id, [...(WADA_COMBOS.get(id) ?? []), index]);
  }
}

/// Garment photo vs. printed swatch: lightness and hue must match, but
/// saturation is forgiven (fabric photographs much duller than ink).
function wadaDistance(garment: Lab, swatch: Lab): number {
  const g = labToLch(garment);
  const w = labToLch(swatch);
  // ...but a neutral piece can only stand for one of Wada's neutrals.
  if (isNeutralColour(g) && w.C > 0.05) return Infinity;
  const hueTerm =
    2 * Math.sqrt(g.C * w.C) * Math.sin((hueGap(g.h, w.h) * Math.PI) / 360);
  return Math.hypot(g.L - w.L, (g.C - w.C) * 0.35, hueTerm);
}

/// Wada colours a piece can stand for: nearest to each of its strong
/// colours, within WADA_DELTA.
const wadaCandidates = new WeakMap<ClothingItem, Map<number, number>>();
function wadaMatchesOf(piece: Piece): Map<number, number> {
  let found = wadaCandidates.get(piece.item);
  if (!found) {
    found = new Map();
    for (const swatch of piece.swatches.filter((s) => s.weight >= 0.2)) {
      WADA_COLOURS.map((w, i) => ({ i, d: wadaDistance(swatch.lab, w.lab) }))
        .filter(({ d }) => d <= WADA_DELTA)
        .sort((x, y) => x.d - y.d)
        .slice(0, 3)
        .forEach(({ i, d }) => {
          if (!found!.has(i) || found!.get(i)! > d) found!.set(i, d);
        });
    }
    wadaCandidates.set(piece.item, found);
  }
  return found;
}

/// The Wada combination this outfit best lands on, if any: every colourful
/// piece (and all but at most one quiet piece) must take a different
/// colour of one of his 3- or 4-colour combinations (pairs are what
/// Classic already uses).
function bestWadaMatch(pieces: Piece[]) {
  const candidates = pieces.map(wadaMatchesOf);
  const comboIds = new Set<number>();
  for (const c of candidates) for (const i of c.keys()) for (const id of WADA_COMBOS_OF[i]) comboIds.add(id);

  let best: { id: number; colours: number[]; score: number } | null = null;
  for (const id of comboIds) {
    const colours = WADA_COMBOS.get(id)!;
    if (colours.length < 3) continue;
    // Small enough to brute-force: try pieces in order, each taking its
    // closest still-free colour of this combination.
    const used = new Set<number>();
    let matched = 0;
    let distance = 0;
    const unmatched: Piece[] = [];
    let colourMatched = false;
    for (const [k, piece] of pieces.entries()) {
      const options = colours
        .filter((c) => !used.has(c) && candidates[k].has(c))
        .sort((a, b) => candidates[k].get(a)! - candidates[k].get(b)!);
      if (options.length === 0) {
        unmatched.push(piece);
        continue;
      }
      used.add(options[0]);
      matched++;
      if (!piece.neutral) colourMatched = true;
      distance += candidates[k].get(options[0])!;
    }
    // At least one coloured piece -- an all-neutral outfit is Classic's job.
    if (matched < 2 || !colourMatched) continue;
    if (unmatched.length > 1 || unmatched.some((p) => !p.quiet)) continue;
    const closeness = 1 - distance / matched / WADA_DELTA;
    let score = (0.65 + 0.35 * closeness) * (unmatched.length === 0 ? 1 : 0.85);
    // A fuller outfit, and one that uses the whole combination, is a
    // better match.
    score *= matched === colours.length ? 1.05 : 0.9;
    score = Math.min(1, score + 0.03 * (matched - 2));
    if (!best || score > best.score) best = { id, colours: [...used], score };
  }
  return best;
}

/* ----------------------------- schemes ----------------------------- */

interface Verdict {
  score: number;
  title: string;
  rationale: string;
  /// Outfits with the same key are "the same idea" -- e.g. one Wada
  /// combination -- and are spread out in the results.
  key: string;
}

function maxHueSpread(pieces: Piece[]): number {
  let spread = 0;
  for (const [i, a] of pieces.entries()) {
    for (const b of pieces.slice(i + 1)) spread = Math.max(spread, hueGap(a.main.lch.h, b.main.lch.h));
  }
  return spread;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function evaluate(scheme: ActiveScheme, pieces: Piece[]): Verdict | null {
  // Pieces whose hue counts, for the hue-based schemes -- at least one of
  // them properly colourful.
  const colourful = pieces.filter((p) => !p.neutral && p.main.lch.C >= TINTED_C);
  const hasHero = colourful.some((p) => p.main.lch.C >= HERO_C);
  let fit: number;
  let title: string;
  let sentence: string;
  let key: string | null = null;

  switch (scheme) {
    case "tonal": {
      if (colourful.length < 2 || !hasHero) return null;
      const spread = maxHueSpread(colourful);
      if (spread > 35) return null;
      const lights = colourful.map((p) => p.lightness);
      const range = Math.max(...lights) - Math.min(...lights);
      fit = (1 - spread / 50) * (0.6 + 0.4 * Math.min(1, range / 0.18));
      const hero = [...colourful].sort((a, b) => b.main.lch.C - a.main.lch.C)[0];
      title = `Shades of ${nameOf(hero.main)}`;
      sentence = "Tonal: one colour family in lighter and darker shades.";
      break;
    }
    case "analogous": {
      if (colourful.length < 2 || !hasHero) return null;
      const spread = maxHueSpread(colourful);
      if (spread < 20 || spread > 105) return null;
      fit = spread <= 75 ? 1 : 1 - (spread - 75) / 30;
      const byHue = [...colourful].sort((a, b) => a.main.lch.h - b.main.lch.h);
      const [a, b] = [nameOf(byHue[0].main), nameOf(byHue[byHue.length - 1].main)];
      title = a === b ? `Shades around ${a}` : `${capitalise(a)} into ${b}`;
      sentence = "Analogous: neighbouring colours that sit together naturally.";
      break;
    }
    case "complementary": {
      if (colourful.length < 2 || !hasHero) return null;
      let pair: [Piece, Piece] | null = null;
      let gap = 0;
      for (const [i, a] of colourful.entries()) {
        for (const b of colourful.slice(i + 1)) {
          const g = hueGap(a.main.lch.h, b.main.lch.h);
          if (g > gap) {
            gap = g;
            pair = [a, b];
          }
        }
      }
      // Real pairings that read as opposites (rust vs. denim) sit 120-160°
      // apart in OKLCH rather than exactly 180°.
      if (!pair || gap < 120) return null;
      fit = gap >= 160 ? 1 : 0.55 + ((gap - 120) / 40) * 0.45;
      const [x, y] = pair;
      const stray = colourful.filter(
        (p) => p !== x && p !== y && Math.min(hueGap(p.main.lch.h, x.main.lch.h), hueGap(p.main.lch.h, y.main.lch.h)) > 35,
      );
      if (stray.length > 0) fit *= 0.7;
      title = `${capitalise(nameOf(x.main))} against ${nameOf(y.main)}`;
      sentence = `Complementary: ${nameOf(x.main)} and ${nameOf(y.main)} sit opposite each other, so each makes the other stand out.`;
      break;
    }
    case "accent": {
      const accents = pieces.filter((p) => !p.quiet);
      if (accents.length !== 1) return null;
      const accent = accents[0];
      fit = accent.print ? 0.95 : 0.7 + 0.3 * Math.min(1, accent.main.lch.C / 0.08);
      title = accent.print
        ? `Neutrals with a ${pieceLabel(accent)} print`
        : `Neutrals with a ${nameOf(accent.main)} accent`;
      const label = pieceLabel(accent);
      sentence = `Neutral base with one accent: the ${label} ${verb(label, "carries", "carry")} the colour and everything else stays quiet.`;
      break;
    }
    case "wada": {
      const match = bestWadaMatch(pieces);
      if (!match) return null;
      fit = match.score;
      key = `wada-${match.id}`;
      const names = match.colours.map((i) => WADA_COLOURS[i].name);
      title = `Wada No. ${match.id}: ${names.slice(0, 2).join(" & ")}`;
      const list =
        names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
      sentence = `Matches combination No. ${match.id} (${list}) from Sanzo Wada's A Dictionary of Color Combinations.`;
      break;
    }
  }

  // Outfit rules shared by every scheme.
  const lights = pieces.map((p) => p.lightness);
  const contrast = Math.max(...lights) - Math.min(...lights);
  if (contrast < 0.08) fit *= 0.75;
  else if (contrast < 0.15) fit *= 0.9;

  if (pieces.filter((p) => p.pattern).length > 1) fit *= 0.6;
  const prints = pieces.filter((p) => p.print);
  if (pieces.filter((p) => p.loud).length > 2) fit *= 0.75;

  let printNote = "";
  if (prints.length === 1) {
    const print = prints[0];
    const echo = pieces.find(
      (p) =>
        p !== print &&
        !p.neutral &&
        print.swatches.some((s) => deltaE(s.lab, p.main.lab) <= PICK_UP_DELTA),
    );
    if (echo) {
      fit = Math.min(1, fit + 0.08);
      const echoLabel = pieceLabel(echo);
      printNote = ` The ${echoLabel} ${verb(echoLabel, "picks", "pick")} up the ${nameOf(echo.main)} in the ${possessive(pieceLabel(print))} print.`;
    }
  }

  return { score: fit, title, rationale: sentence + printNote, key: key ?? title };
}

/* ------------------------- outfit building ------------------------- */

/// Every outfit structure (see lib/categories.ts) from the wardrobe --
/// the same combinations Classic considers.
function buildCombos(
  items: ClothingItem[],
  includeOuterwear: boolean,
  includeShoes: boolean,
): Piece[][] {
  const withRole = (role: OutfitRole) => items.filter((i) => rolesOf(i).includes(role));
  const bases: Piece[][] = [];
  for (const top of withRole("top")) {
    for (const bottom of withRole("bottom")) {
      if (top.id !== bottom.id) bases.push([analyse(top, "top"), analyse(bottom, "bottom")]);
    }
  }
  for (const onePiece of withRole("onepiece")) bases.push([analyse(onePiece, "onepiece")]);
  if (bases.length === 0) {
    throw new OutfitGenerationError(
      "Add a top and a bottom, or a dress or jumpsuit, to use Quick Match.",
    );
  }

  const outerwear = includeOuterwear ? withRole("outerwear") : [];
  const shoes = includeShoes ? withRole("shoes") : [];
  const extras = (base: Piece[], list: ClothingItem[]) => [
    null,
    ...list.filter((item) => !base.some((p) => p.item.id === item.id)),
  ];
  const assemble = (base: Piece[], outer: ClothingItem | null, shoe: ClothingItem | null) => [
    ...base,
    ...(outer ? [analyse(outer, "outerwear")] : []),
    ...(shoe && shoe.id !== outer?.id ? [analyse(shoe, "shoes")] : []),
  ];

  const total = bases.length * (outerwear.length + 1) * (shoes.length + 1);
  const combos: Piece[][] = [];
  if (total <= MAX_COMBOS_EVALUATED) {
    for (const base of bases) {
      for (const outer of extras(base, outerwear)) {
        for (const shoe of extras(base, shoes)) {
          if (shoe && shoe.id === outer?.id) continue;
          combos.push(assemble(base, outer, shoe));
        }
      }
    }
  } else {
    const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
    for (let i = 0; i < MAX_COMBOS_EVALUATED; i++) {
      const base = pick(bases);
      combos.push(assemble(base, pick(extras(base, outerwear)), pick(extras(base, shoes))));
    }
  }
  return combos;
}

interface Candidate {
  pieces: Piece[];
  signature: string;
  verdict: Verdict;
}

function ranked(scheme: ActiveScheme, combos: Piece[][]): Candidate[] {
  const out: Candidate[] = [];
  const seen = new Set<string>();
  for (const pieces of combos) {
    const signature = outfitSignature(pieces.map((p) => p.item.id));
    if (seen.has(signature)) continue;
    seen.add(signature);
    const verdict = evaluate(scheme, pieces);
    if (verdict && verdict.score >= MIN_SCORE) out.push({ pieces, signature, verdict });
  }
  return out.sort((a, b) => b.verdict.score - a.verdict.score);
}

/// Too similar to an outfit already chosen: the same idea (title, or Wada
/// combination), or shares all but one piece.
function tooSimilar(candidate: Candidate, chosen: Candidate[]): boolean {
  const ids = new Set(candidate.pieces.map((p) => p.item.id));
  return chosen.some((c) => {
    if (c.verdict.key === candidate.verdict.key) return true;
    const shared = c.pieces.filter((p) => ids.has(p.item.id)).length;
    return shared >= Math.max(1, Math.min(ids.size, c.pieces.length) - 1);
  });
}

export function generateSchemeOutfits(options: {
  items: ClothingItem[];
  scheme: Exclude<ColorScheme, "classic">;
  count?: number;
  includeOuterwear?: boolean;
  includeShoes?: boolean;
  /// Signatures already shown this session -- avoided while possible.
  excludeSignatures?: ReadonlySet<string>;
}): GeneratedOutfit[] {
  const {
    items,
    scheme,
    count = 3,
    includeOuterwear = true,
    includeShoes = true,
    excludeSignatures,
  } = options;

  const combos = buildCombos(items, includeOuterwear, includeShoes);
  const schemes: ActiveScheme[] = scheme === "mix" ? MIX_ORDER : [scheme];
  const lists = schemes.map((s) => ranked(s, combos));
  const chosen: Candidate[] = [];
  const chosenSignatures = new Set<string>();

  // Progressively relaxed passes: fresh and varied, then varied, then
  // anything -- so a small wardrobe still fills the request. "Surprise
  // me" takes turns between the schemes.
  const passes = [
    (c: Candidate) => !excludeSignatures?.has(c.signature) && !tooSimilar(c, chosen),
    (c: Candidate) => !tooSimilar(c, chosen),
    () => true,
  ];
  for (const accept of passes) {
    let progress = true;
    while (chosen.length < count && progress) {
      progress = false;
      for (const list of lists) {
        if (chosen.length >= count) break;
        const next = list.find((c) => !chosenSignatures.has(c.signature) && accept(c));
        if (next) {
          chosen.push(next);
          chosenSignatures.add(next.signature);
          progress = true;
        }
      }
    }
  }

  if (chosen.length === 0) {
    throw new OutfitGenerationError(
      scheme === "mix"
        ? "Couldn't find outfits for any colour scheme -- try Classic."
        : `No ${SCHEME_LABELS[scheme].toLowerCase()} outfits in your wardrobe yet -- try another colour scheme.`,
    );
  }
  return chosen.map((c) => ({
    title: c.verdict.title,
    rationale: c.verdict.rationale,
    itemIds: c.pieces.map((p) => p.item.id),
  }));
}
