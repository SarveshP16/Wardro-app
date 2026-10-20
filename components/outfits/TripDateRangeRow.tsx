"use client";

import { tripDateRange } from "@/lib/packingList";

/// Packing List's start/end date pickers, with a live day count and a cap
/// at maxDays (see MAX_TRIP_DAYS) so a single AI Stylist call -- one
/// request covers the whole trip, see generateAiPackingList -- stays a
/// reasonable size.
export function TripDateRangeRow({
  startDate,
  endDate,
  maxDays,
  onChange,
}: {
  startDate: string;
  endDate: string;
  maxDays: number;
  onChange: (startDate: string, endDate: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const dayCount = tripDateRange(startDate, endDate).length;
  const tooLong = dayCount > maxDays;

  return (
    <div className="flex flex-col gap-1.5 py-1">
      <div className="flex items-center gap-3 text-sm">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-muted">From</span>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) =>
              onChange(e.target.value, endDate < e.target.value ? e.target.value : endDate)
            }
            className="rounded-control border border-line bg-surface px-2.5 py-1.5 outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-muted">To</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => onChange(startDate, e.target.value)}
            className="rounded-control border border-line bg-surface px-2.5 py-1.5 outline-none focus:border-primary"
          />
        </label>
      </div>
      <p className={`text-xs ${tooLong ? "text-danger" : "text-muted"}`}>
        {dayCount} day{dayCount === 1 ? "" : "s"}
        {tooLong ? ` — trips are limited to ${maxDays} days` : ""}
      </p>
    </div>
  );
}
