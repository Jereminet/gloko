import { COUNTRY_LIST, CountryInfo } from '../data/countries';
import { BIGGEST_CITIES_BY_COUNTRY } from '../data/cities';

export interface GeolocationResult {
  countryId: string;
  countryName: string;
  countryCode: string;
  flag: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Finds the closest country to a given [latitude, longitude] using:
 * 1. Fast online reverse-geocode API (with 2.5s timeout)
 * 2. High-precision nearest major city / capital calculation from local cities database
 */
export async function detectCountryFromCoordinates(lat: number, lon: number): Promise<GeolocationResult> {
  // 1. Try fast online reverse geocoding
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const code = data.countryCode;
      if (code) {
        const matched = COUNTRY_LIST.find((c) => c.code.toUpperCase() === code.toUpperCase());
        if (matched) {
          return {
            countryId: matched.id,
            countryName: matched.name,
            countryCode: matched.code,
            flag: matched.flag,
            city: data.city || data.locality || matched.continent,
            latitude: lat,
            longitude: lon,
          };
        }
      }
    }
  } catch {
    // Fall through to offline calculation
  }

  // 2. Offline nearest city/capital match from local database
  let bestDist = Infinity;
  let bestCountryId = '840';
  let bestCityName = '';

  const latRad = (lat * Math.PI) / 180;

  for (const [countryKey, cities] of Object.entries(BIGGEST_CITIES_BY_COUNTRY)) {
    // Only process 3-digit numeric country codes
    if (countryKey.length !== 3 || !/^\d+$/.test(countryKey)) continue;

    for (const city of cities) {
      const [cityLon, cityLat] = city.coordinates;
      const dx = (lon - cityLon) * Math.cos(latRad);
      const dy = lat - cityLat;
      const dist = dx * dx + dy * dy;

      if (dist < bestDist) {
        bestDist = dist;
        bestCountryId = countryKey;
        bestCityName = city.name;
      }
    }
  }

  const country = COUNTRY_LIST.find((c) => c.id === bestCountryId) || COUNTRY_LIST.find((c) => c.id === '840')!;

  return {
    countryId: country.id,
    countryName: country.name,
    countryCode: country.code,
    flag: country.flag,
    city: bestCityName || country.continent,
    latitude: lat,
    longitude: lon,
  };
}

/**
 * Request device GPS coordinates via HTML5 Geolocation API
 */
export function requestCoordinates(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== 'function') {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Convenience helper to get live country from device GPS
 */
export async function getLiveCountryFromDeviceGPS(): Promise<GeolocationResult | null> {
  const coords = await requestCoordinates();
  if (!coords) return null;
  return detectCountryFromCoordinates(coords.lat, coords.lon);
}
