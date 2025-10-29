export type CurrentWeather = {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeedKmh: number;
  // Combined display string
  location: string; // e.g., "City/Town, State, Country (PIN)"
  // Discrete fields
  city?: string;
  town?: string; // more granular locality when available
  district?: string; // admin district/county
  state?: string;
  country?: string;
  postcode?: string;
  lat: number;
  lon: number;
  localTime?: string; // formatted local time string for the location
};

export type DailyForecast = {
  day: string; // Mon, Tue
  temperature: number; // daytime temp (metric)
  condition: string;
};

export type ForecastWithMeta = {
  days: DailyForecast[];
  isFallback: boolean;
  timezoneName?: string;
  timezoneOffsetSec?: number;
};

export type GeoResult = { lat: number; lon: number; name?: string; town?: string; district?: string; state?: string; country?: string; postcode?: string };

export type SavedLocation = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  town?: string;
  district?: string;
  state?: string;
  country?: string;
  postcode?: string;
  savedAt: number; // timestamp
};
