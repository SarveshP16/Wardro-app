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

const DAY_MS = 86400000;

/// A YYYY-MM-DD string as a UTC timestamp, or null if it isn't one.
/// Calendar arithmetic is done in UTC on purpose: UTC days are always 24h
/// long and never shift the date, whatever the device's timezone (local
/// midnights + toISOString() moved every date back a day east of UTC, and
/// broke across daylight-saving changes).
function parseIsoDate(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(time) ? null : time;
}

/// Every date (YYYY-MM-DD, inclusive) from startDate to endDate. Empty if
/// either isn't a valid date or endDate is before startDate.
export function tripDateRange(startDate: string, endDate: string): string[] {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (start === null || end === null) return [];

  const dates: string[] = [];
  for (let time = start; time <= end; time += DAY_MS) {
    dates.push(new Date(time).toISOString().slice(0, 10));
  }
  return dates;
}

/// `date` (YYYY-MM-DD) moved by `days` (negative goes back).
export function addDays(date: string, days: number): string {
  const time = parseIsoDate(date);
  if (time === null) return date;
  return new Date(time + days * DAY_MS).toISOString().slice(0, 10);
}

/// Today's date on this device (YYYY-MM-DD) -- not UTC's, which is still
/// "yesterday" every morning east of Greenwich.
export function localToday(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
