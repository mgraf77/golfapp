import type { CourseSearchResult, GeoCourse, GeoHazard, GeoHole, LatLng } from '../types/geo'
import { bearing, centroid, distM, distYds, M_TO_YDS, polylineLengthM, ringExtremeToward } from './geo'

/**
 * Real course data, worldwide, from OpenStreetMap.
 *
 * Search    → Overpass `around:` query (nearby) or Nominatim (by name)
 * Download  → fetch every golf feature in the course bounding box, then
 *             assemble holes: centerline (golf=hole), green polygon,
 *             tee point, bunkers/water/fairways near each corridor.
 *
 * Downloaded courses are stored in IndexedDB and work fully offline —
 * the same model Arccos uses for its course files.
 */

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

const ATTRIBUTION = 'Course data © OpenStreetMap contributors (ODbL)'

async function overpass(query: string): Promise<any> {
  let lastErr: Error | null = null
  for (const ep of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      })
      if (!res.ok) throw new Error(`Overpass ${res.status}`)
      return await res.json()
    } catch (e) {
      lastErr = e as Error
    }
  }
  throw lastErr ?? new Error('Course servers unreachable')
}

// ── Search ──────────────────────────────────────────────────────────────

export async function searchCoursesNearby(at: LatLng, radiusKm = 40): Promise<CourseSearchResult[]> {
  const q = `[out:json][timeout:25];
(
  way["leisure"="golf_course"](around:${radiusKm * 1000},${at.lat},${at.lng});
  relation["leisure"="golf_course"](around:${radiusKm * 1000},${at.lat},${at.lng});
);
out center tags;`
  const data = await overpass(q)
  const results: CourseSearchResult[] = []
  for (const el of data.elements ?? []) {
    const c = el.center ?? (el.lat != null ? { lat: el.lat, lon: el.lon } : null)
    if (!c || !el.tags?.name) continue
    const center = { lat: c.lat, lng: c.lon }
    results.push({
      id: `osm-${el.type}-${el.id}`,
      osmType: el.type,
      osmId: el.id,
      name: el.tags.name,
      location: el.tags['addr:city'] ?? el.tags['addr:state'] ?? '',
      center,
      distanceMi: distM(at, center) / 1609.34,
    })
  }
  return dedupe(results).sort((a, b) => (a.distanceMi ?? 0) - (b.distanceMi ?? 0))
}

export async function searchCoursesByName(name: string): Promise<CourseSearchResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=12&q=${encodeURIComponent(name + ' golf')}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const items = (await res.json()) as any[]
  return dedupe(
    items
      .filter((i) => (i.osm_type === 'way' || i.osm_type === 'relation') &&
        (i.type === 'golf_course' || i.class === 'leisure' || /golf/i.test(i.display_name)))
      .map((i) => ({
        id: `osm-${i.osm_type}-${i.osm_id}`,
        osmType: i.osm_type as 'way' | 'relation',
        osmId: Number(i.osm_id),
        name: String(i.display_name).split(',')[0],
        location: String(i.display_name).split(',').slice(1, 3).join(',').trim(),
        center: { lat: Number(i.lat), lng: Number(i.lon) },
      })),
  )
}

function dedupe(results: CourseSearchResult[]): CourseSearchResult[] {
  const seen = new Set<string>()
  return results.filter((r) => {
    const key = r.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Download & parse ────────────────────────────────────────────────────

interface OsmWay {
  id: number
  tags: Record<string, string>
  geometry: { lat: number; lon: number }[]
}

export async function downloadCourse(result: CourseSearchResult): Promise<GeoCourse> {
  // 1. Bounding box of the course polygon
  const ref = result.osmType === 'way' ? `way(${result.osmId})` : `rel(${result.osmId})`
  const bbData = await overpass(`[out:json][timeout:30];${ref};out bb;`)
  const bounds = bbData.elements?.[0]?.bounds
  if (!bounds) throw new Error('Course outline not found')
  const pad = 0.002
  const bbox = `${bounds.minlat - pad},${bounds.minlon - pad},${bounds.maxlat + pad},${bounds.maxlon + pad}`

  // 2. Every golf feature inside it
  const q = `[out:json][timeout:90];
(
  way["golf"](${bbox});
  way["natural"="water"](${bbox});
);
out geom tags;`
  const data = await overpass(q)
  const ways: OsmWay[] = (data.elements ?? []).filter((e: any) => e.type === 'way' && e.geometry?.length)
    .map((e: any) => ({ id: e.id, tags: e.tags ?? {}, geometry: e.geometry }))

  const toLL = (g: { lat: number; lon: number }[]): LatLng[] => g.map((p) => ({ lat: p.lat, lng: p.lon }))

  const holeWays = ways.filter((w) => w.tags.golf === 'hole')
  if (holeWays.length < 3) {
    throw new Error(`"${result.name}" doesn't have hole-by-hole data mapped yet. Try another course nearby — most well-known courses are fully mapped.`)
  }
  const greens = ways.filter((w) => w.tags.golf === 'green').map((w) => toLL(w.geometry))
  const bunkers = ways.filter((w) => w.tags.golf === 'bunker').map((w) => toLL(w.geometry))
  const fairways = ways.filter((w) => w.tags.golf === 'fairway').map((w) => toLL(w.geometry))
  const waters = ways
    .filter((w) => w.tags.golf === 'water_hazard' || w.tags.golf === 'lateral_water_hazard' || w.tags.natural === 'water')
    .map((w) => toLL(w.geometry))

  // 3. Assemble holes
  const parsed: GeoHole[] = []
  for (let i = 0; i < holeWays.length; i++) {
    const w = holeWays[i]
    const line = toLL(w.geometry)
    if (line.length < 2) continue
    const tee = line[0]
    const pinEnd = line[line.length - 1]
    const approachFrom = line[Math.max(0, line.length - 2)]

    // green: nearest green polygon to the end of the centerline
    let greenRing: LatLng[] | undefined
    let bestD = 90 // meters
    for (const g of greens) {
      const d = distM(centroid(g), pinEnd)
      if (d < bestD) {
        bestD = d
        greenRing = g
      }
    }
    const greenCenter = greenRing ? centroid(greenRing) : pinEnd
    const ext = greenRing ? ringExtremeToward(greenRing, approachFrom) : { near: greenCenter, far: greenCenter }

    const lengthM = polylineLengthM(line)
    const yards = Math.round(lengthM * M_TO_YDS)
    const tagPar = parseInt(w.tags.par ?? '')
    const par = ([3, 4, 5] as const).includes(tagPar as 3 | 4 | 5)
      ? (tagPar as 3 | 4 | 5)
      : yards < 245 ? 3 : yards < 475 ? 4 : 5
    const tagHcp = parseInt(w.tags.handicap ?? '')
    const num = parseInt(w.tags.ref ?? '') || parsed.length + 1

    parsed.push({
      number: num,
      par,
      handicap: Number.isFinite(tagHcp) ? tagHcp : 0,
      estimated: !Number.isFinite(tagPar),
      name: w.tags.name,
      line,
      tee,
      greenCenter,
      greenFront: ext.near,
      greenBack: ext.far,
      greenRing,
      hazards: holeHazards(line, { bunkers, waters, fairways }),
      yards,
      bearing: bearing(approachFrom, greenCenter),
    })
  }

  // de-dup hole numbers, order, cap at 18
  const byNum = new Map<number, GeoHole>()
  for (const h of parsed) if (!byNum.has(h.number)) byNum.set(h.number, h)
  const holes = [...byNum.values()].sort((a, b) => a.number - b.number).slice(0, 18)

  // fill missing stroke indexes by length rank (longest = hardest, unique 1..n)
  if (holes.some((h) => !h.handicap)) {
    const ranked = [...holes].sort((a, b) => b.yards - a.yards)
    ranked.forEach((h, idx) => {
      h.handicap = idx + 1
    })
  }

  const par = holes.reduce((s, h) => s + h.par, 0)
  const yards = holes.reduce((s, h) => s + h.yards, 0)
  const rating = estimateRating(yards, holes.length)

  return {
    id: result.id,
    source: 'osm',
    name: result.name,
    location: result.location,
    center: result.center,
    holes,
    par,
    yards,
    rating,
    slope: 120,
    ratingEstimated: true,
    downloadedAt: Date.now(),
    attribution: ATTRIBUTION,
  }
}

/** Hazards whose centroid sits near the hole corridor. */
function holeHazards(
  line: LatLng[],
  features: { bunkers: LatLng[][]; waters: LatLng[][]; fairways: LatLng[][] },
): GeoHazard[] {
  const out: GeoHazard[] = []
  const nearCorridor = (ring: LatLng[], maxM: number): boolean => {
    const c = centroid(ring)
    for (const p of line) if (distM(c, p) < maxM) return true
    return false
  }
  for (const r of features.bunkers) if (nearCorridor(r, 130)) out.push({ type: 'bunker', ring: r })
  for (const r of features.waters) if (nearCorridor(r, 170)) out.push({ type: 'water', ring: r })
  for (const r of features.fairways) if (nearCorridor(r, 120)) out.push({ type: 'fairway', ring: r })
  return out
}

/** USGA-style quick estimate: scratch rating from effective length. */
function estimateRating(yards: number, holeCount: number): number {
  const per18 = holeCount > 0 ? (yards * 18) / holeCount : yards
  const r = per18 / 220 + 40.9
  return Math.round(r * 10) / 10 * (holeCount <= 9 ? 0.5 : 1)
}

/** Distance from current position to a hole's tee, used for auto-advance. */
export function nearestHole(course: GeoCourse, at: LatLng): { hole: GeoHole; teeDistYds: number } | null {
  let best: { hole: GeoHole; teeDistYds: number } | null = null
  for (const h of course.holes) {
    const d = distYds(at, h.tee)
    if (!best || d < best.teeDistYds) best = { hole: h, teeDistYds: d }
  }
  return best
}
