/// Shared, framework-agnostic helpers for Packing List mode -- used by
/// both the client page (date-range UI, lib/weather.ts's forecast calls)
/// and the server (app/api/outfits/generate/packing/route.ts,
/// lib/anthropic.ts's generateAiPackingList). Kept separate from
/// lib/anthropic.ts itself, which pulls in `sharp` and reads
/// ANTHROPIC_API_KEY -- neither belongs in a client bundle.

/// A single AI Stylist call covers the whole trip (see
/// generateAiPackingList), so this just keeps that call's prompt/response
/// a reasonable size rather than reflecting any API limit.
export const MAX_TRIP_DAYS = 14;

/// Every date (YYYY-MM-DD, inclusive) from startDate to endDate. Empty if
/// either isn't a valid date or endDate is before startDate.
export function tripDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const dates: string[] = [];
  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + 86400000)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}
