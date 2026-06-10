import type { LatLng } from '../types/geo'

// ── Geodesy helpers (WGS-84 spherical approximations, plenty for golf) ──

const R_EARTH_M = 6371008.8
export const M_TO_YDS = 1.0936133
export const YDS_TO_M = 0.9144

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/** Great-circle distance in meters. */
export function distM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH_M * Math.asin(Math.min(1, Math.sqrt(s)))
}

export function distYds(a: LatLng, b: LatLng): number {
  return distM(a, b) * M_TO_YDS
}

/** Initial bearing a → b in degrees [0, 360). */
export function bearing(a: LatLng, b: LatLng): number {
  const φ1 = rad(a.lat)
  const φ2 = rad(b.lat)
  const Δλ = rad(b.lng - a.lng)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (deg(Math.atan2(y, x)) + 360) % 360
}

/** Destination point from start, bearing (deg), distance (meters). */
export function destination(from: LatLng, bearingDeg: number, distanceM: number): LatLng {
  const δ = distanceM / R_EARTH_M
  const θ = rad(bearingDeg)
  const φ1 = rad(from.lat)
  const λ1 = rad(from.lng)
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
  return { lat: deg(φ2), lng: ((deg(λ2) + 540) % 360) - 180 }
}

export function destinationYds(from: LatLng, bearingDeg: number, yds: number): LatLng {
  return destination(from, bearingDeg, yds * YDS_TO_M)
}

/** Smallest signed angle a→b in degrees, range (-180, 180]. */
export function angleDelta(a: number, b: number): number {
  let d = (b - a) % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

export function polylineLengthM(line: LatLng[]): number {
  let m = 0
  for (let i = 1; i < line.length; i++) m += distM(line[i - 1], line[i])
  return m
}

export function centroid(ring: LatLng[]): LatLng {
  let lat = 0
  let lng = 0
  for (const p of ring) {
    lat += p.lat
    lng += p.lng
  }
  return { lat: lat / ring.length, lng: lng / ring.length }
}

/** Ray-casting point-in-polygon on lat/lng (fine at golf-hole scale). */
export function pointInRing(p: LatLng, ring: LatLng[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    const intersects =
      a.lng > p.lng !== b.lng > p.lng &&
      p.lat < ((b.lat - a.lat) * (p.lng - a.lng)) / (b.lng - a.lng) + a.lat
    if (intersects) inside = !inside
  }
  return inside
}

/** Distance in meters from point to the nearest vertex of a ring (cheap proxy). */
export function distToRingM(p: LatLng, ring: LatLng[]): number {
  let best = Infinity
  for (const v of ring) {
    const d = distM(p, v)
    if (d < best) best = d
  }
  return best
}

/** Point on ring closest to `toward`, i.e. the "front" edge of a green. */
export function ringExtremeToward(ring: LatLng[], toward: LatLng): { near: LatLng; far: LatLng } {
  let near = ring[0]
  let far = ring[0]
  let nearD = Infinity
  let farD = -Infinity
  for (const v of ring) {
    const d = distM(v, toward)
    if (d < nearD) {
      nearD = d
      near = v
    }
    if (d > farD) {
      farD = d
      far = v
    }
  }
  return { near, far }
}

export function fmtDistance(yds: number): string {
  return `${Math.round(yds)}`
}

/** Compass direction label from degrees. */
export function compassLabel(d: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(((d % 360) / 22.5)) % 16]
}

/**
 * Decompose wind onto a shot line.
 * `windFromDeg` is where the wind comes FROM; `shotBearing` is where the shot goes.
 * Positive head = into the player. Positive cross = pushing ball left→right.
 */
export function windComponents(windMph: number, windFromDeg: number, shotBearing: number): { head: number; cross: number } {
  const rel = rad(angleDelta(shotBearing, windFromDeg))
  return {
    head: windMph * Math.cos(rel),
    cross: -windMph * Math.sin(rel),
  }
}

// ── GPS watcher ─────────────────────────────────────────────────────────

export interface GpsFix extends LatLng {
  accuracyM: number
  heading: number | null
  ts: number
}

export function watchPosition(onFix: (fix: GpsFix) => void, onError?: (msg: string) => void): () => void {
  if (!('geolocation' in navigator)) {
    onError?.('GPS not available on this device')
    return () => {}
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      onFix({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: pos.coords.accuracy,
        heading: pos.coords.heading,
        ts: pos.timestamp,
      })
    },
    (err) => {
      onError?.(
        err.code === err.PERMISSION_DENIED
          ? 'Location permission denied — enable it in your browser settings to use GPS features.'
          : 'Waiting for GPS signal…',
      )
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
  )
  return () => navigator.geolocation.clearWatch(id)
}

/**
 * Best-effort location for course search: quick GPS attempt, then IP
 * geolocation fallback so the nearby list works even with location
 * permission denied or on desktop.
 */
export async function getApproxLocation(): Promise<{ at: LatLng; source: 'gps' | 'ip' }> {
  try {
    const fix = await new Promise<GpsFix>((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject(new Error('no geo'))
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          heading: pos.coords.heading,
          ts: pos.timestamp,
        }),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 8000 },
      )
    })
    return { at: fix, source: 'gps' }
  } catch {
    const res = await fetch('https://ipwho.is/')
    if (!res.ok) throw new Error('Could not determine your location.')
    const data = await res.json()
    if (!data.success || typeof data.latitude !== 'number') throw new Error('Could not determine your location.')
    return { at: { lat: data.latitude, lng: data.longitude }, source: 'ip' }
  }
}

export function getOnce(): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('GPS not available'))
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          heading: pos.coords.heading,
          ts: pos.timestamp,
        }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 12000 },
    )
  })
}
