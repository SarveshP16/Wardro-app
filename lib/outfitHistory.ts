import { prisma } from "./db";
import { outfitSignature } from "./outfitSignature";
import type { GeneratedOutfit } from "./types";

/// Server-only memory of what the AI Stylist has already shown each
/// profile, so it never suggests the same outfit twice -- across visits
/// and devices, not just within one session -- and never re-suggests an
/// outfit the person has already saved.

/// How many past combinations are spelled out in the prompt. Each costs
/// tokens on every request, so only the most recent are listed; the full
/// history still filters the results (see generateAiOutfits'
/// `alreadySeen`).
const MAX_PROMPT_EXCLUSIONS = 50;

/// Everything this profile shouldn't be shown again: `alreadySeen` holds
/// every signature (history + saved outfits + this session's); `promptCombos`
/// is the short, most-recent-first list to name in the prompt.
/// `sessionCombos` are what the page has shown this visit, from either
/// engine (see outfits/page.tsx's `seenSignatures`).
export async function loadSeenOutfits(
  profileId: string,
  sessionCombos: string[][],
  currentItemIds: Set<string>,
): Promise<{ promptCombos: string[][]; alreadySeen: Set<string> }> {
  const [history, saved] = await Promise.all([
    prisma.suggestedOutfit.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
      select: { signature: true },
    }),
    prisma.savedOutfit.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
      select: { items: { select: { itemId: true } } },
    }),
  ]);

  // Most relevant first: this visit's (newest last in the session list),
  // then saved outfits, then older AI suggestions.
  const ordered: string[][] = [
    ...[...sessionCombos].reverse(),
    ...saved.map((outfit) => outfit.items.map((link) => link.itemId)),
    ...history.map((row) => row.signature.split(",")),
  ];

  const alreadySeen = new Set<string>();
  const promptCombos: string[][] = [];
  for (const combo of ordered) {
    const signature = outfitSignature(combo);
    if (alreadySeen.has(signature)) continue;
    alreadySeen.add(signature);
    // A combo that includes a deleted piece can't come back -- no need to
    // spend prompt space on it.
    if (
      promptCombos.length < MAX_PROMPT_EXCLUSIONS &&
      combo.every((id) => currentItemIds.has(id))
    ) {
      promptCombos.push(combo);
    }
  }
  return { promptCombos, alreadySeen };
}

/// Remembers outfits the AI Stylist just showed this profile.
export async function recordSuggestions(
  profileId: string,
  outfits: GeneratedOutfit[],
): Promise<void> {
  if (outfits.length === 0) return;
  await prisma.suggestedOutfit.createMany({
    data: outfits.map((outfit) => ({
      profileId,
      signature: outfitSignature(outfit.itemIds),
    })),
    skipDuplicates: true,
  });
}
