/// A stable, order-independent identifier for an outfit's item set, used
/// wherever we need to recognize "the same outfit" — deduping within a
/// single generation batch, tracking what's already been shown this
/// session (see outfits/page.tsx's `seenSignatures`), and checking
/// whether a result has already been saved. Sorted so it matches
/// regardless of which order the engine (or Claude) happened to list the
/// items in.
export function outfitSignature(itemIds: string[]): string {
  return [...itemIds].sort().join(",");
}
