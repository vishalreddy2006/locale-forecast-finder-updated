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
    state: item.admin1 || item.admin2,
    country: item.country,
  };
}

// Reverse geocoding with enhanced precision for town/district/pincode
// Primary: Nominatim with detailed address parsing; Fallback: BigDataCloud
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ name?: string; state?: string; country?: string; postcode?: string } | null> {
  // Try Nominatim first with zoom=18 for maximum detail
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`;
    const nomRes = await fetch(nomUrl, { 
      headers: { 
        "User-Agent": "sky-watch-pro/1.0", 
        Accept: "application/json" 
      } 
    });
    if (nomRes.ok) {
      const nom = await nomRes.json();
      const addr = nom?.address || {};
      // Enhanced name priority: neighborhood → suburb → municipality → town → village → city
      // This gives most precise locality
      const name = 
        addr.neighbourhood || 
        addr.suburb || 
        addr.municipality || 
        addr.town || 
        addr.village || 
        addr.city || 
        addr.hamlet || 
        addr.quarter;
      
      // Enhanced state/district: Include county/district for better precision
      const state = 
        addr.state || 
        addr.county || 
        addr.state_district || 
        addr.region;
      
      const country = addr.country || (addr.country_code ? String(addr.country_code).toUpperCase() : undefined);
      const postcode = addr.postcode;
      
      // Only return if we got meaningful data
      if (name || state || country || postcode) {
        return { name, state, country, postcode };
      }
    }
  } catch (err) {
    // Silently fall through to BigDataCloud
    if (import.meta.env.DEV) console.warn('Nominatim reverse geocode error:', err);
  }

  // Fallback: BigDataCloud reverse geocode with enhanced locality parsing
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl, { headers: { Accept: "application/json" } });
    if (!bdcRes.ok) return null;
    const j = await bdcRes.json();
    
    // Enhanced name: prioritize most specific locality available
    const name = 
      j.locality || 
      j.city || 
      j.localityInfo?.informative?.[0]?.name ||
      j.principalSubdivisionLocality || 
      j.localityInfo?.administrative?.[0]?.name;
    
    // Enhanced state: Include district/county level
    const state = 
      j.principalSubdivision || 
      j.localityInfo?.administrative?.find((x: { adminLevel?: number }) => x.adminLevel === 4)?.name ||
      j.localityInfo?.administrative?.find((x: { adminLevel?: number }) => x.adminLevel === 5)?.name;
    
    const country = j.countryName || j.countryCode;
    const postcode = j.postcode || j.postalCode;
    
    return { name, state, country, postcode };
  } catch (err) {
    // Final fallback failed
    if (import.meta.env.DEV) console.warn('BigDataCloud reverse geocode error:', err);
    return null;
  }
}
