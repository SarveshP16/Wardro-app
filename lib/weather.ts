import { WeatherError, WeatherSnapshot } from "./types";

/// Port of `weather_service.dart` (OpenMeteoService) — backed by
/// Open-Meteo (open-meteo.com), which needs no API key/signup at all for
/// personal-scale use. Falls back to BigDataCloud's free client-side
/// reverse-geocode for a human-readable place name; that call is
/// best-effort and never fails the weather fetch itself. Runs entirely
/// client-side (uses the browser Geolocation API), same as the original.

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
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

/// Shared by both `fetchCurrentWeather` (GPS) and `fetchWeatherForLocation`
/// (manual search) below. `locationLabel`, when given, skips the
/// reverse-geocode call -- manual search already has a human-readable
/// name from `geocodeLocation`.
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

/// Forward-geocodes a free-text place name (via Open-Meteo's geocoding
/// API -- key-less, same as the forecast API) to coordinates + a
/// canonical display name.
async function geocodeLocation(
  query: string,
): Promise<{ latitude: number; longitude: number; label: string }> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new WeatherError("Enter a location to search for.");
  }

  const url = new URL(GEOCODE_ENDPOINT);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch {
    throw new WeatherError(
      "Could not reach the location search. Check your connection.",
    );
  }
  if (!response.ok) {
    throw new WeatherError("Could not search for that location.");
  }

  const body = await response.json();
  const result = body.results?.[0];
  if (!result) {
    throw new WeatherError(`Could not find "${trimmed}". Try a different search.`);
  }

  const label = [result.name, result.admin1, result.country]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(", ");

  return {
    latitude: result.latitude,
    longitude: result.longitude,
    label: label || trimmed,
  };
}

/// Manual-location counterpart to `fetchCurrentWeather` -- geocodes the
/// given place name, then fetches weather for it, same as the GPS path.
export async function fetchWeatherForLocation(
  query: string,
): Promise<WeatherSnapshot> {
  const { latitude, longitude, label } = await geocodeLocation(query);
  return fetchWeatherAt(latitude, longitude, label);
}
