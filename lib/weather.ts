import { addDays, localToday, tripDateRange } from "./packingList";
import { DailyForecast, Place, WeatherError, WeatherSnapshot } from "./types";

/// Live weather, trip forecasts and place search, backed by
/// Open-Meteo (open-meteo.com), which needs no API key/signup at all for
/// personal-scale use. Falls back to BigDataCloud's free client-side
/// reverse-geocode for a human-readable place name; that call is
/// best-effort and never fails the weather fetch itself. Runs entirely
/// client-side (uses the browser Geolocation API).

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_ENDPOINT = "https://archive-api.open-meteo.com/v1/archive";
const REVERSE_GEOCODE_ENDPOINT =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";
const GEOCODE_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

/// Maps Open-Meteo's WMO weather codes to a broad condition bucket plus a
/// short human description. See
/// https://open-meteo.com/en/docs#weather_variable_documentation
function describeWeatherCode(code: number): [string, string] {
  switch (code) {
    case 0:
      return ["Clear", "clear sky"];
    case 1:
      return ["Clear", "mostly clear"];
    case 2:
      return ["Clouds", "partly cloudy"];
    case 3:
      return ["Clouds", "overcast"];
    case 45:
    case 48:
      return ["Fog", "fog"];
    case 51:
    case 53:
    case 55:
      return ["Drizzle", "drizzle"];
    case 56:
    case 57:
      return ["Drizzle", "freezing drizzle"];
    case 61:
    case 63:
      return ["Rain", "rain"];
    case 65:
      return ["Rain", "heavy rain"];
    case 66:
    case 67:
      return ["Rain", "freezing rain"];
    case 71:
    case 73:
      return ["Snow", "snow"];
    case 75:
      return ["Snow", "heavy snow"];
    case 77:
      return ["Snow", "snow grains"];
    case 80:
    case 81:
      return ["Rain", "rain showers"];
    case 82:
      return ["Rain", "violent rain showers"];
    case 85:
    case 86:
      return ["Snow", "snow showers"];
    case 95:
      return ["Thunderstorm", "thunderstorm"];
    case 96:
    case 99:
      return ["Thunderstorm", "thunderstorm with hail"];
    default:
      return ["Clear", ""];
  }
}

function resolvePosition(): Promise<GeolocationPosition> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(
      new WeatherError("This browser can't provide your location."),
    );
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new WeatherError(
                "Location access is blocked for Wardro. Enable it in your " +
                  "browser's site settings to use live weather.",
              ),
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new WeatherError("Could not determine your location."));
            break;
          case error.TIMEOUT:
            reject(new WeatherError("Could not determine your location."));
            break;
          default:
            reject(new WeatherError("Could not determine your location."));
        }
      },
      { enableHighAccuracy: false, timeout: 15000 },
    );
  });
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const url = new URL(REVERSE_GEOCODE_ENDPOINT);
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("localityLanguage", "en");
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return "";
    const body = await response.json();
    if (typeof body.city === "string" && body.city.length > 0) {
      return body.city;
    }
    return typeof body.locality === "string" ? body.locality : "";
  } catch {
    return "";
  }
}

/// Shared by `fetchCurrentWeather` (GPS), `fetchWeatherForPlace` (search)
/// and `fetchTripWeather` below. `locationLabel`, when given, skips the
/// reverse-geocode call -- a searched place already has a name.
async function fetchWeatherAt(
  latitude: number,
  longitude: number,
  locationLabel?: string,
): Promise<WeatherSnapshot> {
  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("timezone", "auto");

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  } catch {
    throw new WeatherError(
      "Could not reach the weather service. Check your connection.",
    );
  }
  if (!response.ok) {
    throw new WeatherError(`Could not fetch weather (${response.status}).`);
  }

  const body = await response.json();
  const current = body.current ?? {};
  const code = Number(current.weather_code ?? 0);
  const [condition, description] = describeWeatherCode(code);

  return {
    temperatureCelsius: Number(current.temperature_2m ?? 0),
    condition,
    description,
    locationLabel: locationLabel ?? (await reverseGeocode(latitude, longitude)),
  };
}

export async function fetchCurrentWeather(): Promise<WeatherSnapshot> {
  const position = await resolvePosition();
  return fetchWeatherAt(position.coords.latitude, position.coords.longitude);
}

/// "Gold Coast, Queensland, Australia".
export function placeLabel(place: Place): string {
  return [place.name, place.region].filter(Boolean).join(", ");
}

/// Places matching a (partial) name, best match first, via Open-Meteo's
/// geocoding API -- key-less, same as the forecast API. Two letters at
/// least; Open-Meteo matches name prefixes from three.
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(GEOCODE_ENDPOINT);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetch(url, {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new WeatherError(
      "Could not reach the location search. Check your connection.",
    );
  }
  if (!response.ok) {
    throw new WeatherError("Could not search for that location.");
  }

  const body = await response.json();
  const results: Record<string, unknown>[] = Array.isArray(body.results)
    ? body.results
    : [];
  // Small places can share a name and region; only the first (largest)
  // of those is worth offering, since they'd look identical.
  const seen = new Set<string>();
  return results.flatMap((result) => {
    const { id, name, latitude, longitude } = result;
    if (
      typeof name !== "string" ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return [];
    }
    const region = [result.admin1, result.country]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .filter((part) => part !== name)
      .join(", ");
    const place = { id: Number(id) || 0, name, region, latitude, longitude };
    if (seen.has(placeLabel(place))) return [];
    seen.add(placeLabel(place));
    return [place];
  });
}

/// Manual-location counterpart to `fetchCurrentWeather`.
export async function fetchWeatherForPlace(place: Place): Promise<WeatherSnapshot> {
  return fetchWeatherAt(place.latitude, place.longitude, placeLabel(place));
}

/// Open-Meteo's free forecast endpoint only covers ~16 days ahead -- trip
/// days past this use the typical weather for the date instead (see
/// fetchTypicalDays).
const MAX_FORECAST_DAYS_AHEAD = 15;

/// "Typical" weather is the average of the same dates over this many past
/// years, counting this many days either side of each date too, so one
/// freak hot or wet day doesn't decide it.
const TYPICAL_YEARS = 10;
const TYPICAL_WINDOW_DAYS = 3;

/// A day counts as wet with at least 1 mm of rain, snowy with 0.5 cm of
/// snow.
const WET_DAY_MM = 1;
const SNOW_DAY_CM = 0.5;

const round1 = (value: number) => Math.round(value * 10) / 10;

async function fetchDaily(
  endpoint: string,
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
  variables: string[],
): Promise<Record<string, unknown[]>> {
  const url = new URL(endpoint);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("daily", variables.join(","));
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  } catch {
    throw new WeatherError(
      "Could not reach the weather service. Check your connection.",
    );
  }
  if (!response.ok) {
    throw new WeatherError(`Could not fetch the forecast (${response.status}).`);
  }
  const body = await response.json();
  return body.daily ?? {};
}

/// The real forecast for those of `dates` it covers.
async function fetchForecastDays(
  latitude: number,
  longitude: number,
  dates: string[],
): Promise<DailyForecast[]> {
  if (dates.length === 0) return [];
  const daily = await fetchDaily(
    FORECAST_ENDPOINT,
    latitude,
    longitude,
    dates[0],
    dates[dates.length - 1],
    ["weather_code", "temperature_2m_max", "temperature_2m_min"],
  );
  const times = (daily.time ?? []) as string[];
  return times.flatMap((date, i) => {
    const high = Number(daily.temperature_2m_max?.[i]);
    const low = Number(daily.temperature_2m_min?.[i]);
    if (!Number.isFinite(high) || !Number.isFinite(low)) return [];
    const [condition, description] = describeWeatherCode(
      Number(daily.weather_code?.[i] ?? 0),
    );
    return [
      {
        date,
        temperatureCelsius: round1((high + low) / 2),
        highCelsius: high,
        lowCelsius: low,
        condition,
        description,
        source: "forecast" as const,
      },
    ];
  });
}

/// `date` moved by whole years; 29 Feb lands on 28 Feb in other years.
function shiftYears(date: string, years: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const year = y + years;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const day = m === 2 && d === 29 && !leap ? 28 : d;
  return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/// What `dates` are usually like: the average low/high of the same dates
/// over the last TYPICAL_YEARS years, and how often it rained or snowed
/// then (Open-Meteo's historical archive). For trip days beyond the
/// forecast -- not a prediction, so it's labelled "typical" everywhere.
async function fetchTypicalDays(
  latitude: number,
  longitude: number,
  dates: string[],
): Promise<DailyForecast[]> {
  if (dates.length === 0) return [];
  const first = dates[0];
  const last = dates[dates.length - 1];

  // One small request per past year, covering the trip's dates in that
  // year plus the window either side.
  const years = await Promise.allSettled(
    Array.from({ length: TYPICAL_YEARS }, (_, i) => {
      const back = -(i + 1);
      return fetchDaily(
        ARCHIVE_ENDPOINT,
        latitude,
        longitude,
        addDays(shiftYears(first, back), -TYPICAL_WINDOW_DAYS),
        addDays(shiftYears(last, back), TYPICAL_WINDOW_DAYS),
        ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "snowfall_sum"],
      );
    }),
  );

  type PastDay = { high: number; low: number; rain: number; snow: number };
  const past = new Map<string, PastDay>();
  for (const year of years) {
    if (year.status !== "fulfilled") continue;
    const daily = year.value;
    ((daily.time ?? []) as string[]).forEach((date, i) => {
      const high = Number(daily.temperature_2m_max?.[i] ?? NaN);
      const low = Number(daily.temperature_2m_min?.[i] ?? NaN);
      if (!Number.isFinite(high) || !Number.isFinite(low)) return;
      past.set(date, {
        high,
        low,
        rain: Number(daily.precipitation_sum?.[i] ?? 0),
        snow: Number(daily.snowfall_sum?.[i] ?? 0),
      });
    });
  }
  if (past.size === 0) {
    const failed = years.find((y) => y.status === "rejected");
    throw failed?.reason ?? new WeatherError("No past weather for this place.");
  }

  return dates.flatMap((date) => {
    const samples: PastDay[] = [];
    for (let back = 1; back <= TYPICAL_YEARS; back++) {
      const sameDay = shiftYears(date, -back);
      for (let offset = -TYPICAL_WINDOW_DAYS; offset <= TYPICAL_WINDOW_DAYS; offset++) {
        const sample = past.get(addDays(sameDay, offset));
        if (sample) samples.push(sample);
      }
    }
    if (samples.length === 0) return [];
    const mean = (pick: (s: PastDay) => number) =>
      samples.reduce((sum, s) => sum + pick(s), 0) / samples.length;
    const high = round1(mean((s) => s.high));
    const low = round1(mean((s) => s.low));
    const wet = mean((s) => (s.rain >= WET_DAY_MM ? 1 : 0));
    const snowy = mean((s) => (s.snow >= SNOW_DAY_CM ? 1 : 0));
    const [condition, description] =
      snowy >= 0.3
        ? ["Snow", "snow on many days"]
        : wet >= 0.5
          ? ["Rain", "rain on most days"]
          : wet >= 0.25
            ? ["Rain", "rain on some days"]
            : ["Clear", "usually dry"];
    return [
      {
        date,
        temperatureCelsius: round1((high + low) / 2),
        highCelsius: high,
        lowCelsius: low,
        condition,
        description,
        source: "typical" as const,
      },
    ];
  });
}

export interface TripWeather {
  locationLabel: string;
  /// Right now at the destination -- just for reference; null if that
  /// lookup failed.
  now: WeatherSnapshot | null;
  /// One entry per trip date it could find weather for: the forecast
  /// where there is one, otherwise the typical weather for the date.
  days: DailyForecast[];
}

/// Packing List's weather: `place`, or the device's location when null.
export async function fetchTripWeather(
  place: Place | null,
  startDate: string,
  endDate: string,
): Promise<TripWeather> {
  let latitude: number;
  let longitude: number;
  let label: string | undefined;
  if (place) {
    ({ latitude, longitude } = place);
    label = placeLabel(place);
  } else {
    ({ latitude, longitude } = (await resolvePosition()).coords);
  }

  // The device's own date, like the trip's (see lib/packingList.ts).
  const today = localToday();
  const lastForecastDay = addDays(today, MAX_FORECAST_DAYS_AHEAD);
  const dates = tripDateRange(startDate, endDate);
  const forecastable = dates.filter((d) => d >= today && d <= lastForecastDay);
  const beyond = dates.filter((d) => !forecastable.includes(d));

  const [now, forecast, typical] = await Promise.allSettled([
    fetchWeatherAt(latitude, longitude, label),
    fetchForecastDays(latitude, longitude, forecastable),
    fetchTypicalDays(latitude, longitude, beyond),
  ]);

  const days = [forecast, typical]
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (days.length === 0) {
    const failed = [forecast, typical].find((r) => r.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  }

  const current = now.status === "fulfilled" ? now.value : null;
  return {
    locationLabel: label ?? current?.locationLabel ?? "",
    now: current,
    days,
  };
}
