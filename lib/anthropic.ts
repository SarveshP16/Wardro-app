import sharp from "sharp";

import { readImage } from "./imageStore";
import { SEASON_LABELS, STYLE_LABELS } from "./labels";
import { outfitSignature } from "./outfitSignature";
import { MAX_TRIP_DAYS } from "./packingList";
import {
  ClothingItem,
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

/// Packing List's schema -- same shape as OUTFITS_SCHEMA plus a `date` per
/// outfit, which Claude is asked to echo back from the itinerary so the
/// response can be matched to days by date rather than by array order
/// (see parsePackingOutfits).
const PACKING_LIST_SCHEMA = {
  type: "object",
  properties: {
    outfits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          title: { type: "string" },
          rationale: { type: "string" },
          itemIds: { type: "array", items: { type: "string" } },
        },
        required: ["date", "title", "rationale", "itemIds"],
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
/// never reach the prompt at all, so Claude can't reach for them. Shared
/// by generateAiOutfits and generateAiPackingList.
function selectEligibleItems(
  items: ClothingItem[],
  includeOuterwear: boolean,
  includeShoes: boolean,
): ClothingItem[] {
  return items.filter((item) => {
    if (!includeOuterwear && item.category === "outerwear") return false;
    if (!includeShoes && item.category === "shoes") return false;
    return true;
  });
}

/// Describes which categories are on offer, for the "mix categories
/// sensibly" instruction. Shared by generateAiOutfits and
/// generateAiPackingList.
function categoryHintFor(includeOuterwear: boolean, includeShoes: boolean): string {
  return includeOuterwear && includeShoes
    ? "a top, a bottom, and optionally outerwear and/or shoes"
    : includeOuterwear
      ? "a top, a bottom, and optionally outerwear (no shoes are offered)"
      : includeShoes
        ? "a top, a bottom, and optionally shoes (no outerwear is offered)"
        : "a top and a bottom (no outerwear or shoes are offered)";
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
      text: `item id: ${item.id} | category: ${item.category}`,
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
  const categoryHint = categoryHintFor(includeOuterwear, includeShoes);

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
          `wardrobe for a '${styleLabel}' occasion.${weatherHint}${seasonHint} ` +
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
        `to a ${styleLabel} occasion, each using 2-4 of the items above (mix ` +
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
  includeOuterwear?: boolean;
  includeShoes?: boolean;
  /// Fallback for any day without a weather forecast (too far ahead --
  /// see MAX_FORECAST_DAYS_AHEAD in lib/weather.ts -- or live weather is
  /// off); ignored for days that do have one, same as generateAiOutfits
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
  } = options;

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

  const styleLabel = STYLE_LABELS[style];
  const validIds = new Set(eligibleItems.map((item) => item.id));
  const categoryHint = categoryHintFor(includeOuterwear, includeShoes);
  const hasAnyWeather = days.some((day) => day.weather !== null);

  const dayLines = days
    .map((day) => {
      if (day.weather) {
        return (
          `${day.date}: ${day.weather.condition.toLowerCase()}` +
          `${day.weather.description ? `, ${day.weather.description}` : ""}, ` +
          `${Math.round(day.weather.temperatureCelsius)}°C`
        );
      }
      return (
        `${day.date}: no forecast available` +
        (season ? ` (use the ${SEASON_LABELS[season].toLowerCase()} season instead)` : "")
      );
    })
    .join("\n");

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
        `outfits from a user's own wardrobe for a '${styleLabel}' ` +
        "occasion. Here is the itinerary, one line per day (date: " +
        `conditions):\n${dayLines}\n\n` +
        "Each image below is one wardrobe item; its id and category are " +
        "given right before it. Only ever use the item ids provided -- " +
        `never invent one.${avoidHint}`,
    },
    ...(await wardrobeImageBlocks(eligibleItems)),
    {
      type: "text",
      text:
        `Propose exactly ${days.length} outfits, one for each date above ` +
        `(set "date" to that exact date string), each using 2-4 of the ` +
        `items above (mix categories sensibly: ${categoryHint}). Favor ` +
        "combinations that genuinely look good together -- color and " +
        `pattern harmony, and appropriateness for ${appropriatenessFactors}. ` +
        "Vary the combinations across days as much as the wardrobe allows " +
        "so the trip doesn't repeat the same look day after day.",
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
        // Scales with trip length -- one call covers every day.
        max_tokens: 1024 + days.length * 512,
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
      date?: string;
      title?: string;
      rationale?: string;
      itemIds?: string[];
    }>;
  };
  const rawOutfits = parsed.outfits ?? [];

  // Match by date first (Claude was asked to echo the exact date string
  // back). Anything with an unrecognized or duplicate date is banked and
  // handed to whichever requested day is still missing an outfit, in
  // order -- same defensive spirit as parseOutfits' id filtering, since a
  // structured schema still isn't a hard guarantee of a clean 1:1 match.
  const byDate = new Map<string, GeneratedOutfit>();
  const unmatched: GeneratedOutfit[] = [];
  const knownDates = new Set(days.map((day) => day.date));
  for (const raw of rawOutfits) {
    const itemIds = (raw.itemIds ?? []).filter((id) => validIds.has(id));
    if (itemIds.length === 0) continue;
    const outfit: GeneratedOutfit = {
      title: raw.title ?? "Outfit",
      rationale: raw.rationale ?? "",
      itemIds,
    };
    if (raw.date && knownDates.has(raw.date) && !byDate.has(raw.date)) {
      byDate.set(raw.date, outfit);
    } else {
      unmatched.push(outfit);
    }
  }

  const result: PackingDayOutfit[] = [];
  for (const day of days) {
    const outfit = byDate.get(day.date) ?? unmatched.shift();
    if (outfit) result.push({ date: day.date, outfit, weather: day.weather });
  }
  return result;
}
