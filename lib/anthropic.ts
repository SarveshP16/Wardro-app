import sharp from "sharp";

import { readImage } from "./imageStore";
import { ROLE_OF } from "./categories";
import { SEASON_LABELS, STYLE_LABELS } from "./labels";
import { outfitSignature } from "./outfitSignature";
import { MAX_TRIP_DAYS } from "./packingList";
import {
  ClothingItem,
  Gender,
  GeneratedOutfit,
  OutfitGenerationError,
  OutfitStyle,
  PackingDayInput,
  PackingDayOutfit,
  Season,
  WeatherSnapshot,
} from "./types";

/// The AI Stylist: calls the Anthropic Messages API directly with
/// ANTHROPIC_API_KEY. The key lives only in this server-side module's
/// environment and is never sent to the browser.
///
/// A plain `fetch` is used instead of the `@anthropic-ai/sdk` package so
/// the request body matches the original, already-proven-correct Dart
/// implementation byte-for-byte (structured `output_config.format`
/// output, same schema) rather than depending on the SDK's own — possibly
/// differently-shaped — support for that feature.

const MAX_DIMENSION = 512;
const OUTFIT_COUNT = 3;
const MODEL = "claude-opus-5";
const ANTHROPIC_VERSION = "2023-06-01";

const OUTFITS_SCHEMA = {
  type: "object",
  properties: {
    outfits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          itemIds: { type: "array", items: { type: "string" } },
        },
        required: ["title", "rationale", "itemIds"],
        additionalProperties: false,
      },
    },
  },
  required: ["outfits"],
  additionalProperties: false,
};

/// Packing List's schema -- same shape as OUTFITS_SCHEMA plus the `dates`
/// each outfit is worn on (a trip can have fewer outfits than days, re-worn),
/// which Claude echoes back from the itinerary so the response can be
/// matched to days by date rather than by array order (see
/// parsePackingOutfits).
const PACKING_LIST_SCHEMA = {
  type: "object",
  properties: {
    outfits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dates: { type: "array", items: { type: "string" } },
          title: { type: "string" },
          rationale: { type: "string" },
          itemIds: { type: "array", items: { type: "string" } },
        },
        required: ["dates", "title", "rationale", "itemIds"],
        additionalProperties: false,
      },
    },
  },
  required: ["outfits"],
  additionalProperties: false,
};

interface ContentBlock {
  type: "text" | "image";
  text?: string;
  source?: { type: "base64"; media_type: string; data: string };
}

interface GenerateAiOutfitsOptions {
  items: ClothingItem[];
  style: OutfitStyle;
  /// Whose wardrobe this is, when the profile says (Settings → Clothing).
  gender?: Gender;
  includeOuterwear?: boolean;
  includeShoes?: boolean;
  weather?: WeatherSnapshot | null;
  /// null/omitted means no season preference ("any season").
  season?: Season | null;
  /// Item-id sets Claude is told not to repeat, listed in the prompt.
  /// Keep this short (it costs tokens on every call) -- the most recent
  /// and most relevant combos; see app/api/outfits/generate/ai/route.ts.
  excludeCombos?: string[][];
  /// Every outfit signature (see lib/outfitSignature.ts) that must never
  /// be shown again -- the full history, which can be far longer than
  /// what fits in the prompt. Results matching one are dropped. Defaults
  /// to the signatures of `excludeCombos`.
  alreadySeen?: Set<string>;
}

async function resizeForApi(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes).resize(MAX_DIMENSION).png().toBuffer();
}

/// Only offer the categories the user asked to include -- excluded ones
/// never reach the prompt at all, so Claude can't reach for them. A piece
/// with several categories keeps the others (an overshirt stays on offer
/// as a top when outerwear is off). Shared by generateAiOutfits and
/// generateAiPackingList.
function selectEligibleItems(
  items: ClothingItem[],
  includeOuterwear: boolean,
  includeShoes: boolean,
): ClothingItem[] {
  return items
    .map((item) => ({
      ...item,
      categories: item.categories.filter(
        (c) =>
          (includeOuterwear || c !== "outerwear") && (includeShoes || c !== "shoes"),
      ),
    }))
    .filter((item) => item.categories.length > 0);
}

/// How outfits are built, for the "mix categories sensibly" instruction
/// (see lib/categories.ts). Shared by generateAiOutfits and
/// generateAiPackingList.
function categoryHintFor(
  eligibleItems: ClothingItem[],
  includeOuterwear: boolean,
  includeShoes: boolean,
): string {
  const roles = new Set(eligibleItems.flatMap((i) => i.categories.map((c) => ROLE_OF[c])));
  const core = roles.has("onepiece")
    ? "either a top and a bottom (a skirt counts as a bottom), or a one-piece " +
      "(a dress or jumpsuit) instead of both"
    : "a top and a bottom";
  const extras = [includeOuterwear ? "outerwear" : null, includeShoes ? "shoes" : null]
    .filter((x): x is string => x !== null)
    .join(" and/or ");
  const missing = [!includeOuterwear ? "outerwear" : null, !includeShoes ? "shoes" : null]
    .filter((x): x is string => x !== null)
    .join(" or ");
  return (
    core +
    (extras ? `, plus optionally ${extras}` : "") +
    (missing ? ` (no ${missing} are offered)` : "") +
    ". A piece listed with several categories can fill any one of them, " +
    "but never appears twice in one outfit"
  );
}

/// What each occasion means, so Claude reads e.g. "Active" or "Wedding
/// guest" the way the user does.
const STYLE_HINTS: Record<OutfitStyle, string> = {
  casual: "relaxed everyday wear",
  smart_casual: "polished but not formal",
  work: "office-appropriate business casual",
  interview: "polished, conservative and confidence-building",
  formal: "tailored and formal",
  evening: "dressed up for an evening out",
  date_night: "flattering and a little elevated, for a date",
  party: "fun and a little bolder, for a party",
  wedding_guest: "dressed up for a wedding as a guest -- not black tie, and never all white",
  active: "practical, easy-to-move-in pieces for exercise or an active day",
  travel: "comfortable, layered and easy to wear on a travel day",
  beach: "light, breathable resort wear for the beach",
  lounge: "comfortable, easy pieces for relaxing at home",
};

function occasionText(style: OutfitStyle): string {
  return `'${STYLE_LABELS[style]}' occasion (${STYLE_HINTS[style]})`;
}

function genderHint(gender: Gender | undefined): string {
  return gender === "women"
    ? " The wardrobe belongs to a woman."
    : gender === "men"
      ? " The wardrobe belongs to a man."
      : "";
}

/// One (id + category) text block and one image block per eligible item
/// -- the wardrobe photos every generation call attaches. Shared by
/// generateAiOutfits and generateAiPackingList.
async function wardrobeImageBlocks(
  eligibleItems: ClothingItem[],
): Promise<ContentBlock[]> {
  const blocks: ContentBlock[] = [];
  for (const item of eligibleItems) {
    const original = await readImage(item.id);
    const resized = await resizeForApi(original);
    blocks.push({
      type: "text",
      text:
        item.categories.length > 1
          ? `item id: ${item.id} | categories: ${item.categories.join(", ")} (use as any one)`
          : `item id: ${item.id} | category: ${item.categories[0]}`,
    });
    blocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: resized.toString("base64"),
      },
    });
  }
  return blocks;
}

export async function generateAiOutfits(
  options: GenerateAiOutfitsOptions,
): Promise<GeneratedOutfit[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new OutfitGenerationError(
      "AI Stylist isn't configured yet (missing ANTHROPIC_API_KEY — see .env.example).",
    );
  }

  const {
    items,
    style,
    includeOuterwear = true,
    includeShoes = true,
    weather = null,
    season = null,
    excludeCombos = [],
    gender,
  } = options;
  const alreadySeen =
    options.alreadySeen ?? new Set(excludeCombos.map(outfitSignature));

  if (items.length === 0) {
    throw new OutfitGenerationError("Add some wardrobe items first.");
  }

  const eligibleItems = selectEligibleItems(items, includeOuterwear, includeShoes);
  if (eligibleItems.length < 2) {
    throw new OutfitGenerationError(
      "Not enough items in the selected categories to build an outfit.",
    );
  }

  const styleLabel = STYLE_LABELS[style];
  const validIds = new Set(eligibleItems.map((item) => item.id));
  const categoryHint = categoryHintFor(eligibleItems, includeOuterwear, includeShoes);

  const weatherHint = weather
    ? ` The current weather is ${weather.condition.toLowerCase()}${
        weather.description ? `, ${weather.description}` : ""
      } at ${Math.round(weather.temperatureCelsius)}°C -- factor this ` +
      "in alongside the occasion (e.g. favor heavier layers or outerwear " +
      "in cold or wet weather, lighter breathable pieces in hot weather, " +
      "and avoid anything impractical for the conditions)."
    : "";

  const seasonHint = season
    ? ` It is currently ${SEASON_LABELS[season].toLowerCase()} -- factor ` +
      "the season into fabric weight, layering, and color choices " +
      "alongside the occasion."
    : "";

  // Encoded once and reused if the request has to be retried.
  const imageBlocks = await wardrobeImageBlocks(eligibleItems);

  const requestOutfits = async (avoidCombos: string[][]) => {
    const content: ContentBlock[] = [
      {
        type: "text",
        text:
          `You are a fashion stylist choosing outfits from a user's own ` +
          `wardrobe for a ${occasionText(style)}.${genderHint(gender)}${weatherHint}${seasonHint} ` +
          "Each image below is one wardrobe item; its id and category are " +
          "given right before it. Only ever use the item ids provided -- " +
          `never invent one.${avoidHintFor(avoidCombos)}`,
      },
      ...imageBlocks,
    ];

    const appropriatenessFactors = [
      "the occasion",
      weather ? "weather" : null,
      season ? "season" : null,
    ]
      .filter((factor): factor is string => factor !== null)
      .join(" and ");

    content.push({
      type: "text",
      text:
        `Propose exactly ${OUTFIT_COUNT} distinct outfit combinations suited ` +
        `to a ${styleLabel} occasion, each using 1-4 of the items above (mix ` +
        `categories sensibly: ${categoryHint}). Favor combinations that ` +
        "genuinely look good together -- color and pattern harmony, and " +
        `appropriateness for ${appropriatenessFactors}.`,
    });

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          messages: [{ role: "user", content }],
          output_config: {
            format: { type: "json_schema", schema: OUTFITS_SCHEMA },
          },
        }),
        signal: AbortSignal.timeout(60000),
      });
    } catch {
      throw new OutfitGenerationError(
        "Could not reach Claude. Check your connection and try again.",
      );
    }

    if (!response.ok) {
      let message = `Outfit generation failed (${response.status}).`;
      try {
        const body = await response.json();
        if (typeof body?.error?.message === "string") {
          message = body.error.message;
        }
      } catch {
        // Keep the generic message above.
      }
      throw new OutfitGenerationError(message);
    }

    return parseOutfits(await response.json(), validIds, alreadySeen);
  };

  let result = await requestOutfits(excludeCombos);
  // Every proposal was something already shown or saved (the prompt only
  // lists recent history): ask once more, naming those combos too.
  if (result.outfits.length === 0 && result.repeats.length > 0) {
    result = await requestOutfits([...excludeCombos, ...result.repeats]);
  }
  if (result.outfits.length === 0) {
    throw new OutfitGenerationError(
      result.repeats.length > 0
        ? "No new outfits for these settings -- the AI Stylist only came up " +
          "with ones you've already seen or saved. Try another occasion or " +
          "season, or add more pieces."
        : "Could not put together an outfit from these items. Try a different style.",
    );
  }
  return result.outfits;
}

function avoidHintFor(combos: string[][]): string {
  return combos.length > 0
    ? " Avoid exactly repeating any of these item-id combinations, " +
        "already suggested or saved earlier: " +
        combos.map((ids) => `[${ids.join(", ")}]`).join("; ") +
        " -- propose different combinations instead."
    : "";
}

function parseOutfits(
  body: Record<string, unknown>,
  validIds: Set<string>,
  alreadySeen: Set<string>,
): { outfits: GeneratedOutfit[]; repeats: string[][] } {
  if (body.stop_reason === "refusal") {
    throw new OutfitGenerationError(
      "Claude declined to generate outfits for this request.",
    );
  }

  const blocks = Array.isArray(body.content) ? body.content : [];
  const textBlock = blocks.find(
    (block): block is { type: string; text: string } =>
      typeof block === "object" &&
      block !== null &&
      (block as { type?: unknown }).type === "text",
  );
  if (!textBlock) {
    throw new OutfitGenerationError(
      "Claude did not return a structured outfit proposal.",
    );
  }

  const parsed = JSON.parse(textBlock.text) as {
    outfits?: Array<{ title?: string; rationale?: string; itemIds?: string[] }>;
  };
  const rawOutfits = parsed.outfits ?? [];

  // Defensive: drop any hallucinated item id, any outfit left empty by
  // that, and any exact repeat of something already shown or saved (the
  // prompt hint is usually enough, but isn't guaranteed -- and only lists
  // recent history).
  const cleaned: GeneratedOutfit[] = [];
  const repeats: string[][] = [];
  for (const raw of rawOutfits) {
    const itemIds = (raw.itemIds ?? []).filter((id) => validIds.has(id));
    if (itemIds.length === 0) continue;
    if (alreadySeen.has(outfitSignature(itemIds))) {
      repeats.push(itemIds);
      continue;
    }
    cleaned.push({
      title: raw.title ?? "Outfit",
      rationale: raw.rationale ?? "",
      itemIds,
    });
  }
  return { outfits: cleaned, repeats };
}

interface GenerateAiPackingListOptions {
  items: ClothingItem[];
  style: OutfitStyle;
  gender?: Gender;
  /// How many distinct outfits to plan for the whole trip (1 .. days);
  /// fewer than days means some are re-worn. Defaults to one per day.
  outfitCount?: number;
  includeOuterwear?: boolean;
  includeShoes?: boolean;
  /// Fallback for any day without weather (the lookup failed, or weather
  /// is off); ignored for days that have it, same as generateAiOutfits
  /// ignoring it whenever its own weather is on.
  season?: Season | null;
  days: PackingDayInput[];
  /// Same session-wide "already suggested" tracking generateAiOutfits
  /// takes, passed through only as a prompt hint here (not defensively
  /// filtered afterward -- see parsePackingOutfits) since dropping a
  /// day's outfit would leave that day without one.
  excludeCombos?: string[][];
}

/// The AI Stylist's Packing List mode -- one call covering the whole
/// trip (rather than looping generateAiOutfits once per day), so cost
/// stays flat regardless of trip length and Claude can see the full
/// itinerary at once to keep days from repeating the same look.
export async function generateAiPackingList(
  options: GenerateAiPackingListOptions,
): Promise<PackingDayOutfit[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new OutfitGenerationError(
      "AI Stylist isn't configured yet (missing ANTHROPIC_API_KEY — see .env.example).",
    );
  }

  const {
    items,
    style,
    includeOuterwear = true,
    includeShoes = true,
    season = null,
    days,
    excludeCombos = [],
    gender,
  } = options;
  const outfitCount = Math.min(
    Math.max(Math.round(options.outfitCount ?? days.length), 1),
    days.length,
  );

  if (days.length === 0) {
    throw new OutfitGenerationError("Add at least one day to plan a trip.");
  }
  if (days.length > MAX_TRIP_DAYS) {
    throw new OutfitGenerationError(`Trips are limited to ${MAX_TRIP_DAYS} days.`);
  }
  if (items.length === 0) {
    throw new OutfitGenerationError("Add some wardrobe items first.");
  }

  const eligibleItems = selectEligibleItems(items, includeOuterwear, includeShoes);
  if (eligibleItems.length < 2) {
    throw new OutfitGenerationError(
      "Not enough items in the selected categories to build an outfit.",
    );
  }

  const validIds = new Set(eligibleItems.map((item) => item.id));
  const categoryHint = categoryHintFor(eligibleItems, includeOuterwear, includeShoes);
  const hasAnyWeather = days.some((day) => day.weather !== null);
  const hasTypical = days.some((day) => day.weather?.source === "typical");

  // Each day's low-high rather than one number, so a cool morning and a
  // hot afternoon can mean layers. Days beyond the forecast get what the
  // date is usually like there, flagged as such.
  const dayLines = days
    .map((day) => {
      const weather = day.weather;
      if (weather) {
        const range = `${Math.round(weather.lowCelsius)}-${Math.round(weather.highCelsius)}°C`;
        return weather.source === "typical"
          ? `${day.date}: no forecast yet -- typically ${range} there at this ` +
              `time of year, ${weather.description}`
          : `${day.date}: forecast ${weather.description || weather.condition.toLowerCase()}, ${range}`;
      }
      return (
        `${day.date}: no forecast available` +
        (season ? ` (use the ${SEASON_LABELS[season].toLowerCase()} season instead)` : "")
      );
    })
    .join("\n");
  const weatherNote = hasAnyWeather
    ? "Temperatures are each day's low-high." +
      (hasTypical
        ? ' "Typically" days are averages of recent years, not a forecast -- ' +
          "pack so those days can cope with a little warmer or cooler than that."
        : "")
    : "";

  const avoidHint =
    excludeCombos.length > 0
      ? " Also try to avoid exactly repeating any of these item-id " +
        "combinations, already suggested earlier: " +
        excludeCombos.map((ids) => `[${ids.join(", ")}]`).join("; ") +
        "."
      : "";

  const appropriatenessFactors = [
    "the occasion",
    hasAnyWeather ? "each day's weather" : null,
    season ? "season" : null,
  ]
    .filter((factor): factor is string => factor !== null)
    .join(" and ");

  const content: ContentBlock[] = [
    {
      type: "text",
      text:
        `You are a fashion stylist packing a ${days.length}-day trip's ` +
        `outfits from a user's own wardrobe for a ${occasionText(style)}.` +
        `${genderHint(gender)} Here is the itinerary, one line per day (date: ` +
        `conditions):\n${dayLines}\n${weatherNote}\n` +
        "Each image below is one wardrobe item; its id and category are " +
        "given right before it. Only ever use the item ids provided -- " +
        `never invent one.${avoidHint}`,
    },
    ...(await wardrobeImageBlocks(eligibleItems)),
    {
      type: "text",
      text:
        (outfitCount === days.length
          ? `Propose exactly ${days.length} outfits, one for each date above ` +
            '(set "dates" to that one exact date string)'
          : `Pack light: propose exactly ${outfitCount} distinct outfits to ` +
            `cover all ${days.length} dates above, re-wearing them across the ` +
            'trip. Set each outfit\'s "dates" to the exact date strings it is ' +
            "worn on, so that every date appears in exactly one outfit, and " +
            "favor pieces that work across several of the outfits") +
        `, each outfit using 1-4 of the items above (mix categories ` +
        `sensibly: ${categoryHint}). Favor combinations that genuinely look ` +
        "good together -- color and pattern harmony, and appropriateness " +
        `for ${appropriatenessFactors}. Vary the combinations as much as the ` +
        "wardrobe allows so the trip doesn't repeat the same look.",
    },
  ];

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        // Scales with the number of outfits -- one call covers the trip.
        max_tokens: 1024 + outfitCount * 512 + days.length * 32,
        messages: [{ role: "user", content }],
        output_config: {
          format: { type: "json_schema", schema: PACKING_LIST_SCHEMA },
        },
      }),
      signal: AbortSignal.timeout(90000),
    });
  } catch {
    throw new OutfitGenerationError(
      "Could not reach Claude. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    let message = `Outfit generation failed (${response.status}).`;
    try {
      const body = await response.json();
      if (typeof body?.error?.message === "string") {
        message = body.error.message;
      }
    } catch {
      // Keep the generic message above.
    }
    throw new OutfitGenerationError(message);
  }

  const body = await response.json();
  const result = parsePackingOutfits(body, validIds, days);
  if (result.length === 0) {
    throw new OutfitGenerationError(
      "Could not put together outfits for this trip. Try a different style.",
    );
  }
  return result;
}

function parsePackingOutfits(
  body: Record<string, unknown>,
  validIds: Set<string>,
  days: PackingDayInput[],
): PackingDayOutfit[] {
  if (body.stop_reason === "refusal") {
    throw new OutfitGenerationError(
      "Claude declined to generate outfits for this request.",
    );
  }

  const blocks = Array.isArray(body.content) ? body.content : [];
  const textBlock = blocks.find(
    (block): block is { type: string; text: string } =>
      typeof block === "object" &&
      block !== null &&
      (block as { type?: unknown }).type === "text",
  );
  if (!textBlock) {
    throw new OutfitGenerationError(
      "Claude did not return a structured outfit proposal.",
    );
  }

  const parsed = JSON.parse(textBlock.text) as {
    outfits?: Array<{
      dates?: string[];
      title?: string;
      rationale?: string;
      itemIds?: string[];
    }>;
  };
  const rawOutfits = parsed.outfits ?? [];

  // Match by the dates Claude echoed back. A date claimed by two outfits
  // goes to the first; any date left uncovered (or an outfit with no
  // recognised date) is filled in from the outfits in order -- same
  // defensive spirit as parseOutfits' id filtering, since a structured
  // schema still isn't a hard guarantee of a clean match.
  const byDate = new Map<string, GeneratedOutfit>();
  const outfits: GeneratedOutfit[] = [];
  const knownDates = new Set(days.map((day) => day.date));
  for (const raw of rawOutfits) {
    const itemIds = (raw.itemIds ?? []).filter((id) => validIds.has(id));
    if (itemIds.length === 0) continue;
    const outfit: GeneratedOutfit = {
      title: raw.title ?? "Outfit",
      rationale: raw.rationale ?? "",
      itemIds,
    };
    outfits.push(outfit);
    for (const date of raw.dates ?? []) {
      if (knownDates.has(date) && !byDate.has(date)) byDate.set(date, outfit);
    }
  }

  const result: PackingDayOutfit[] = [];
  let next = 0;
  for (const day of days) {
    let outfit = byDate.get(day.date);
    if (!outfit && outfits.length > 0) {
      // Prefer an outfit not yet worn; otherwise cycle through them.
      outfit =
        outfits.find((o) => ![...byDate.values()].includes(o)) ??
        outfits[next++ % outfits.length];
      byDate.set(day.date, outfit);
    }
    if (outfit) result.push({ date: day.date, outfit, weather: day.weather });
  }
  return result;
}
