/// Runs once when the server starts. Kicks off the palette backfill for
/// wardrobe pieces saved before palettes existed (lib/palette.ts) --
/// without awaiting it, so the server is ready immediately and the
/// backfill finishes in the background.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { backfillPalettes } = await import("./lib/palette");
  void backfillPalettes().catch((error) => {
    console.error("palette backfill failed:", error);
  });
}
