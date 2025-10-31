import type { CurrentWeather, DailyForecast, ForecastWithMeta, HourlyForecast } from "../types";
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
  // Request current weather, hourly data, and daily min/max for today
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&daily=temperature_2m_min,temperature_2m_max&timezone=auto&forecast_days=1`;
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

  // Get today's min and max temperature
  let todayMinTemp: number | undefined;
  let todayMaxTemp: number | undefined;
  try {
    const minTemps: number[] = j.daily?.temperature_2m_min || [];
    const maxTemps: number[] = j.daily?.temperature_2m_max || [];
    if (minTemps.length > 0) todayMinTemp = Math.round(Number(minTemps[0]));
    if (maxTemps.length > 0) todayMaxTemp = Math.round(Number(maxTemps[0]));
  } catch {
    // Ignore daily temp parsing errors
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
    todayMinTemp,
    todayMaxTemp,
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

export async function get24HourForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,relativehumidity_2m,windspeed_10m&timezone=auto&forecast_days=2`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch hourly forecast (Open-Meteo)");
  const j = await res.json();
  
  const hourlyData: HourlyForecast[] = [];
  const times: string[] = j.hourly?.time || [];
  const temps: number[] = j.hourly?.temperature_2m || [];
  const codes: number[] = j.hourly?.weathercode || [];
  const humidity: number[] = j.hourly?.relativehumidity_2m || [];
  const windSpeed: number[] = j.hourly?.windspeed_10m || [];
  const timezone = j?.timezone || 'UTC';
  
  // Get current hour to start from
  const now = new Date();
  
  for (let i = 0; i < Math.min(24, times.length); i++) {
    try {
      const timeStr = times[i];
      const date = new Date(timeStr);
      
      // Skip past hours
      if (date < now) continue;
      
      // Format hour display
      const hourDisplay = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: true,
        timeZone: timezone
      }).format(date);
      
      hourlyData.push({
        time: hourDisplay,
        temperature: Math.round(Number(temps[i] ?? 0)),
        condition: codeToCondition(Number(codes[i])),
        humidity: Math.round(Number(humidity[i] ?? 0)),
        windSpeed: Math.round(Number(windSpeed[i] ?? 0))
      });
      
      // Stop after 24 entries
      if (hourlyData.length >= 24) break;
    } catch {
      // Skip this hour on error
      continue;
    }
  }
  
  return hourlyData;
}
