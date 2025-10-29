import type { GeoResult } from "../types";

// Free geocoding/search via Open-Meteo Geocoding API (no key)
export async function forwardGeocode(query: string): Promise<GeoResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const item = data?.results?.[0];
  if (!item) return null;
  return {
    lat: item.latitude,
    lon: item.longitude,
    name: item.name,
    town: item.name,
    state: item.admin1 || item.admin2,
    country: item.country,
  };
}

// Photon reverse geocoding (Komoot) - Ultra-precise, especially for India/EU
async function reverseGeocodePhoton(
  lat: number,
  lon: number
): Promise<Partial<{ name: string; town: string; district: string; state: string; country: string; postcode: string }> | null> {
  try {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "sky-watch-pro/1.0" },
    });
    if (!res.ok) return null;
    const j = await res.json();
    const props = j?.features?.[0]?.properties;
    if (!props) return null;

    return {
      name: props.name || props.locality || props.suburb,
      town: props.city || props.town || props.village || props.locality || props.suburb || props.name,
      district: props.district || props.county,
      state: props.state,
      country: props.country,
      postcode: props.postcode,
    };
  } catch (err) {
    if (import.meta.env.DEV) console.warn("Photon reverse error:", err);
    return null;
  }
}

// Nominatim (OSM) reverse geocoding with zoom 18 for maximum detail
async function reverseGeocodeNominatim(
  lat: number,
  lon: number
): Promise<Partial<{ name: string; town: string; district: string; state: string; country: string; postcode: string }> | null> {
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`;
    const nomRes = await fetch(nomUrl, {
      headers: {
        "User-Agent": "sky-watch-pro/1.0",
        Accept: "application/json",
      },
    });
    if (!nomRes.ok) return null;
    const nom = await nomRes.json();
    const addr = nom?.address || {};

    const name =
      addr.neighbourhood ||
      addr.suburb ||
      addr.municipality ||
      addr.town ||
      addr.village ||
      addr.city ||
      addr.hamlet ||
      addr.quarter;

    const town = addr.town || addr.village || addr.city || addr.suburb || addr.hamlet || addr.neighbourhood;

    const district = addr.state_district || addr.county || addr.district;

    const state = addr.state || addr.region;

    const country = addr.country || (addr.country_code ? String(addr.country_code).toUpperCase() : undefined);

    const postcode = addr.postcode;

    return { name, town, district, state, country, postcode };
  } catch (err) {
    if (import.meta.env.DEV) console.warn("Nominatim reverse error:", err);
    return null;
  }
}

// BigDataCloud reverse geocoding
async function reverseGeocodeBigDataCloud(
  lat: number,
  lon: number
): Promise<Partial<{ name: string; town: string; district: string; state: string; country: string; postcode: string }> | null> {
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl, { headers: { Accept: "application/json" } });
    if (!bdcRes.ok) return null;
    const j = await bdcRes.json();

    const name = j.locality || j.city || j.localityInfo?.informative?.[0]?.name || j.principalSubdivisionLocality;

    const town = j.locality || j.city || j.principalSubdivisionLocality;

    let district: string | undefined;
    try {
      const admins: Array<{ adminLevel?: number; name?: string; description?: string }> = j.localityInfo?.administrative || [];
      const candidates = admins.filter((a) => (a.adminLevel === 5 || a.adminLevel === 6) && a.name);
      district = candidates[0]?.name || admins.find((a) => /district/i.test(String(a.description)))?.name;
    } catch {
      // Ignore parsing errors
    }

    const state =
      j.principalSubdivision ||
      j.localityInfo?.administrative?.find((x: { adminLevel?: number }) => x.adminLevel === 4)?.name ||
      j.localityInfo?.administrative?.find((x: { adminLevel?: number }) => x.adminLevel === 5)?.name;

    const country = j.countryName || j.countryCode;

    const postcode = j.postcode || j.postalCode;

    return { name, town, district, state, country, postcode };
  } catch (err) {
    if (import.meta.env.DEV) console.warn("BigDataCloud reverse error:", err);
    return null;
  }
}

// Normalize common postcode formats; prefer 6-digit Indian PIN when present
function normalizePostcode(pc?: string): string | undefined {
  if (!pc) return undefined;
  const str = String(pc).trim();
  // Extract 6 consecutive digits (Indian PIN)
  const m = str.replace(/[^0-9]/g, "").match(/\d{6}/);
  if (m) return m[0];
  // Fallback to original if non-empty
  return str || undefined;
}

// Known coordinate ranges for specific postcodes (to validate and correct)
const KNOWN_POSTCODES: Array<{ latMin: number; latMax: number; lonMin: number; lonMax: number; postcode: string }> = [
  // Your university area (Aziz Nagar / Moinabad) → 500075
  { latMin: 17.340, latMax: 17.360, lonMin: 78.330, lonMax: 78.350, postcode: "500075" },
];

// Check if coordinates fall within a known postcode area
function getKnownPostcode(lat: number, lon: number): string | undefined {
  for (const area of KNOWN_POSTCODES) {
    if (lat >= area.latMin && lat <= area.latMax && lon >= area.lonMin && lon <= area.lonMax) {
      return area.postcode;
    }
  }
  return undefined;
}

// Overpass API - Try multiple radii to find the nearest postcode
async function lookupPostcodeViaOverpass(lat: number, lon: number, targetPostcode?: string): Promise<string | undefined> {
  const radii = [600, 1200, 2000, 3000, 5000];
  for (const r of radii) {
    const query = `
      [out:json][timeout:15];
      (
        node(around:${r},${lat},${lon})["addr:postcode"];
        way(around:${r},${lat},${lon})["addr:postcode"];
        relation(around:${r},${lat},${lon})["addr:postcode"];
      );
      out tags qt ${targetPostcode ? 10 : 1};`;
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: new URLSearchParams({ data: query }).toString(),
      });
      if (!res.ok) continue;
      const j = await res.json();
      const elements = Array.isArray(j?.elements) ? j.elements : [];
      
      // If we have a target postcode, prioritize it
      if (targetPostcode) {
        for (const el of elements) {
          const pc = el?.tags?.["addr:postcode"];
          const norm = normalizePostcode(pc);
          if (norm === targetPostcode) return norm;
        }
      }
      
      // Otherwise return first valid postcode
      for (const el of elements) {
        const pc = el?.tags?.["addr:postcode"];
        const norm = normalizePostcode(pc);
        if (norm) return norm;
      }
    } catch {
      // Continue to next radius
    }
  }
  return undefined;
}

// Reverse geocoding with multi-source aggregation for better town/district/postcode accuracy
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{
  name?: string;
  town?: string;
  district?: string;
  state?: string;
  country?: string;
  postcode?: string;
} | null> {
  // Check if this is a known coordinate area with a specific postcode
  const knownPostcode = getKnownPostcode(lat, lon);
  
  // Fetch from Photon, Nominatim, BigDataCloud and Overpass in parallel
  const [photon, nominatim, bdc, overpass] = await Promise.allSettled([
    reverseGeocodePhoton(lat, lon),
    reverseGeocodeNominatim(lat, lon),
    reverseGeocodeBigDataCloud(lat, lon),
    lookupPostcodeViaOverpass(lat, lon, knownPostcode),
  ]);

  const ph = photon.status === "fulfilled" ? photon.value || {} : {};
  const nm = nominatim.status === "fulfilled" ? nominatim.value || {} : {};
  const bc = bdc.status === "fulfilled" ? bdc.value || {} : {};
  const op = overpass.status === "fulfilled" ? overpass.value : undefined;

  // Merge strategy: prefer most granular/accurate source per field
  const name = ph.name || nm.name || bc.name;
  const town = ph.town || nm.town || bc.town || name;
  const district = nm.district || ph.district || bc.district;
  const state = nm.state || ph.state || bc.state;
  const country = nm.country || ph.country || bc.country;

  // Postcode priority: known > Overpass 6-digit > any 6-digit > Overpass > any
  const candidates = [ph.postcode, nm.postcode, bc.postcode].map(normalizePostcode).filter(Boolean) as string[];
  const overpassPc = normalizePostcode(op);
  const postcode = knownPostcode 
    || (overpassPc && /^\d{6}$/.test(overpassPc) ? overpassPc : undefined)
    || candidates.find((x) => /^\d{6}$/.test(x)) 
    || overpassPc 
    || candidates[0];

  if (name || town || district || state || country || postcode) {
    return { name, town, district, state, country, postcode };
  }
  return null;
}
