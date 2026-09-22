import sharp from "sharp";

import { readImage } from "./imageStore";
import { SEASON_LABELS, STYLE_LABELS } from "./labels";
import { outfitSignature } from "./outfitSignature";
import {
  ClothingItem,
  GeneratedOutfit,
  OutfitGenerationError,
  OutfitStyle,
  Season,
  WeatherSnapshot,
} from "./types";

/// Server-side port of `HttpOutfitGenerationService`
/// (outfit_generation_service.dart) — calls the Anthropic Messages API
/// directly with ANTHROPIC_API_KEY. Unlike the original Flutter app, the
/// key now lives only in this server-side module's environment and is
/// never sent to the browser (see project memory / plan for why this
/// changed once the app became a self-hosted server instead of a
/// single-user mobile binary).
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

interface ContentBlock {
  type: "text" | "image";
  text?: string;
  source?: { type: "base64"; media_type: string; data: string };
}

export interface GenerateAiOutfitsOptions {
  items: ClothingItem[];
  style: OutfitStyle;
  includeOuterwear?: boolean;
  includeShoes?: boolean;
  weather?: WeatherSnapshot | null;
  /// null/omitted means no season preference ("any season").
  season?: Season | null;
  /// Item-id sets already suggested earlier this session (across either
  /// engine) -- see outfits/page.tsx's `seenSignatures`. Claude is asked
  /// not to repeat these, and any it returns anyway are filtered out
  /// defensively (see `parseOutfits`).
  excludeCombos?: string[][];
}

async function resizeForApi(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes).resize(MAX_DIMENSION).png().toBuffer();
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

  if (items.length === 0) {
    throw new OutfitGenerationError("Add some wardrobe items first.");
  }

  // Only offer the categories the user asked to include -- excluded ones
  // never reach the prompt at all, so Claude can't reach for them.
  const eligibleItems = items.filter((item) => {
    if (!includeOuterwear && item.category === "outerwear") return false;
    if (!includeShoes && item.category === "shoes") return false;
    return true;
  });
  if (eligibleItems.length < 2) {
    throw new OutfitGenerationError(
      "Not enough items in the selected categories to build an outfit.",
    );
  }

  const styleLabel = STYLE_LABELS[style];
  const validIds = new Set(eligibleItems.map((item) => item.id));

  const categoryHint =
    includeOuterwear && includeShoes
      ? "a top, a bottom, and optionally outerwear and/or shoes"
      : includeOuterwear
        ? "a top, a bottom, and optionally outerwear (no shoes are offered)"
        : includeShoes
          ? "a top, a bottom, and optionally shoes (no outerwear is offered)"
          : "a top and a bottom (no outerwear or shoes are offered)";

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

  const avoidHint =
    excludeCombos.length > 0
      ? " Avoid exactly repeating any of these item-id combinations, " +
        "already suggested earlier: " +
        excludeCombos.map((ids) => `[${ids.join(", ")}]`).join("; ") +
        " -- propose different combinations instead."
      : "";

  const content: ContentBlock[] = [
    {
      type: "text",
      text:
        `You are a fashion stylist choosing outfits from a user's own ` +
        `wardrobe for a '${styleLabel}' occasion.${weatherHint}${seasonHint} ` +
        "Each image below is one wardrobe item; its id and category are " +
        "given right before it. Only ever use the item ids provided -- " +
        `never invent one.${avoidHint}`,
    },
  ];

  for (const item of eligibleItems) {
    const original = await readImage(item.id);
    const resized = await resizeForApi(original);
    content.push({
      type: "text",
      text: `item id: ${item.id} | category: ${item.category}`,
    });
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: resized.toString("base64"),
      },
    });
  }

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

  const excludeSignatures = new Set(excludeCombos.map(outfitSignature));
  const body = await response.json();
  const outfits = parseOutfits(body, validIds, excludeSignatures);
  if (outfits.length === 0) {
    throw new OutfitGenerationError(
      "Could not put together an outfit from these items. Try a different style.",
    );
  }
  return outfits;
}

function parseOutfits(
  body: Record<string, unknown>,
  validIds: Set<string>,
  excludeSignatures: Set<string>,
): GeneratedOutfit[] {
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
  // that, and any exact repeat of a combination Claude was asked to avoid
  // (the prompt hint above is usually enough, but isn't guaranteed).
  const cleaned: GeneratedOutfit[] = [];
  for (const raw of rawOutfits) {
    const itemIds = (raw.itemIds ?? []).filter((id) => validIds.has(id));
    if (itemIds.length === 0) continue;
    if (excludeSignatures.has(outfitSignature(itemIds))) continue;
    cleaned.push({
      title: raw.title ?? "Outfit",
      rationale: raw.rationale ?? "",
      itemIds,
    });
  }
  return cleaned;
}
