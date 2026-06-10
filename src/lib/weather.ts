import type { LatLng, WeatherSnapshot } from '../types/geo'

/**
 * Live weather via Open-Meteo (free, keyless). Cached ~10 min per location
 * so the round screen can poll freely.
 */

const WMO: Record<number, string> = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + hail',
}

let cache: { key: string; snap: WeatherSnapshot } | null = null

export async function fetchWeather(at: LatLng): Promise<WeatherSnapshot> {
  const key = `${at.lat.toFixed(2)},${at.lng.toFixed(2)}`
  if (cache && cache.key === key && Date.now() - cache.snap.fetchedAt < 10 * 60 * 1000) {
    return cache.snap
  }
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${at.lat}&longitude=${at.lng}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather unavailable (${res.status})`)
  const data = await res.json()
  const c = data.current
  const snap: WeatherSnapshot = {
    tempF: Math.round(c.temperature_2m),
    windMph: Math.round(c.wind_speed_10m),
    windGustMph: Math.round(c.wind_gusts_10m),
    windFromDeg: Math.round(c.wind_direction_10m),
    humidity: Math.round(c.relative_humidity_2m),
    precipMmHr: c.precipitation ?? 0,
    code: c.weather_code,
    label: WMO[c.weather_code] ?? 'Unknown',
    fetchedAt: Date.now(),
  }
  cache = { key, snap }
  return snap
}

export function windDescription(w: WeatherSnapshot): string {
  if (w.windMph < 4) return 'Calm — trust your stock numbers'
  if (w.windMph < 10) return 'Light breeze — half-club effect at most'
  if (w.windMph < 18) return 'Real wind — club up into it, flight it down'
  return 'Heavy wind — swing easy, take 2+ extra clubs into it'
}
