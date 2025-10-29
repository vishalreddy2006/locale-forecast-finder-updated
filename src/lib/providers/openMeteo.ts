import type { CurrentWeather, DailyForecast, ForecastWithMeta } from "../types";
import { reverseGeocode } from "./geocoding";

// WMO weather code mapping to human-readable conditions
const WMO: Record<number, string> = {
  0: "Clear",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  56: "Freezing Drizzle",
  57: "Freezing Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Heavy Rain Showers",
  85: "Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm + Hail",
  99: "Thunderstorm + Hail",
};

function codeToCondition(code?: number): string {
  if (typeof code !== "number") return "";
  return WMO[code] || "";
}

export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  // Request current weather and hourly humidity to estimate current humidity
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch current weather (Open-Meteo)");
  const j = await res.json();

  const cw = j.current_weather || {};
  const temp = Number(cw.temperature);
  const windKmh = Math.round(Number(cw.windspeed || 0));
  const wmo = Number(cw.weathercode);
  let humidity = 0;
  try {
    const times: string[] = j.hourly?.time || [];
    const hums: number[] = j.hourly?.relativehumidity_2m || [];
    if (times.length && hums.length) {
      // Find the closest hour index to current time
      const nowIso = (cw.time as string) || new Date().toISOString();
      let idx = times.indexOf(nowIso);
      if (idx === -1) {
        // fallback: pick the last hourly value
        idx = hums.length - 1;
      }
      humidity = Math.round(Number(hums[Math.max(0, idx)] || 0));
    }
  } catch {
    // Ignore humidity parsing errors; default to 0
  }

  const rev = await reverseGeocode(lat, lon);
  const displayName = rev?.town || rev?.name;
  const parts = [displayName].filter(Boolean) as string[];
  if (rev?.state) parts.push(rev.state);
  if (rev?.country) parts.push(rev.country);
  const pinSuffix = rev?.postcode ? ` (${rev.postcode})` : "";

  // timezone from Open-Meteo response
  let localTime: string | undefined;
  try {
    const tz = j?.timezone;
    const now = Date.now();
    if (tz) {
      const fmt = new Intl.DateTimeFormat('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz
      });
      localTime = fmt.format(now);
    }
  } catch {
    // Ignore timezone formatting errors
  }

  return {
    temperature: temp,
    condition: codeToCondition(wmo),
    humidity,
    windSpeedKmh: windKmh,
    location: `${parts.join(", ")}${pinSuffix}`,
    city: displayName,
    town: rev?.town,
    district: rev?.district,
    state: rev?.state,
    country: rev?.country,
    postcode: rev?.postcode,
    lat,
    lon,
    localTime,
  };
}

export async function getSevenDayForecastWithMeta(lat: number, lon: number): Promise<ForecastWithMeta> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch forecast (Open-Meteo)");
  const j = await res.json();
  const days: DailyForecast[] = [];
  const times: string[] = j.daily?.time || [];
  const temps: number[] = j.daily?.temperature_2m_max || [];
  const codes: number[] = j.daily?.weathercode || [];
  for (let i = 0; i < Math.min(7, times.length); i++) {
    const date = new Date(times[i]);
    days.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      temperature: Number(temps[i] ?? 0),
      condition: codeToCondition(Number(codes[i])),
    });
  }
  return {
    days,
    isFallback: false,
    timezoneName: j?.timezone,
    timezoneOffsetSec: undefined,
  };
}
