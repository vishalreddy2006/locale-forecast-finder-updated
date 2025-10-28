export async function ipGeolocation(): Promise<{ lat: number; lon: number; city?: string; region?: string; country?: string; postal?: string } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const j = await res.json();
    const lat = Number(j.latitude || j.lat);
    const lon = Number(j.longitude || j.lon || j.longitude);
    return { lat, lon, city: j.city, region: j.region || j.region_code, country: j.country_name || j.country, postal: j.postal };
  } catch {
    return null;
  }
}
