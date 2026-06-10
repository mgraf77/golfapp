// ── Geo / GPS domain types ──────────────────────────────────────────────

export interface LatLng {
  lat: number
  lng: number
}

export type GeoHazardType = 'water' | 'bunker' | 'fairway' | 'green' | 'tee-box' | 'trees' | 'ob'

export interface GeoHazard {
  type: GeoHazardType
  /** Closed polygon, [lat,lng] ring. */
  ring: LatLng[]
}

export interface GeoHole {
  number: number
  par: 3 | 4 | 5
  /** Stroke index 1-18 (1 = hardest). */
  handicap: number
  /** Whether par/handicap came from real course data or were estimated from length. */
  estimated: boolean
  name?: string
  /** Hole centerline tee → green, from course data. */
  line: LatLng[]
  tee: LatLng
  /** Geometric center of the green polygon (or end of hole line). */
  greenCenter: LatLng
  greenFront: LatLng
  greenBack: LatLng
  /** Green outline if mapped. */
  greenRing?: LatLng[]
  /** Hazards near this hole's corridor. */
  hazards: GeoHazard[]
  yards: number
  /** Bearing of the approach into the green, degrees. */
  bearing: number
}

export interface GeoCourse {
  id: string // e.g. osm-way-123 / osm-rel-456
  source: 'osm'
  name: string
  location: string
  center: LatLng
  holes: GeoHole[]
  par: number
  yards: number
  /** Course rating / slope — estimated from length unless user-edited. */
  rating: number
  slope: number
  ratingEstimated: boolean
  downloadedAt: number
  attribution: string
}

export interface CourseSearchResult {
  id: string
  osmType: 'way' | 'relation'
  osmId: number
  name: string
  location: string
  center: LatLng
  distanceMi?: number
  holesMapped?: number
}

// ── Weather ─────────────────────────────────────────────────────────────

export interface WeatherSnapshot {
  tempF: number
  windMph: number
  windGustMph: number
  /** Direction wind is COMING FROM, degrees true. */
  windFromDeg: number
  humidity: number
  precipMmHr: number
  code: number
  label: string
  fetchedAt: number
}

// ── GPS shot tracking ───────────────────────────────────────────────────

export interface TrackedShotStart {
  clubId: string
  start: LatLng
  distToPinStart: number
  lie: string
  ts: number
}

// ── Swing studio ────────────────────────────────────────────────────────

export interface SwingMetric {
  key: string
  label: string
  value: string
  score: number // 0-100
  ideal: string
  comment: string
}

export interface SwingFault {
  id: string
  name: string
  severity: 'minor' | 'moderate' | 'major'
  evidence: string
  fix: string
  drillIds: string[]
}

export interface SwingReport {
  analyzedAt: number
  fps: number
  frames: number
  view: 'face-on' | 'down-the-line' | 'unknown'
  events: { address: number; top: number; impact: number; finish: number } // seconds
  tempoRatio: number
  metrics: SwingMetric[]
  faults: SwingFault[]
  summary: string
  score: number // 0-100 overall
}

export interface TracerPoint {
  t: number // video time, s
  x: number // 0-1 normalized
  y: number
}

export interface SwingRecord {
  id: string
  name: string
  date: string
  durationS: number
  mimeType: string
  report?: SwingReport
  tracer?: TracerPoint[]
  note?: string
}

// ── Handicap ────────────────────────────────────────────────────────────

export interface ScoreEntry {
  id: string
  date: string // ISO
  courseName: string
  adjustedGross: number
  rating: number
  slope: number
  par: number
  holes: 9 | 18
  differential: number
  /** Round id if this entry came from a tracked round. */
  roundId?: string
  exceptional?: boolean
}

export interface HandicapDetail {
  index: number | null
  used: number // differentials used
  total: number
  lowIndex: number | null
  capApplied: 'none' | 'soft' | 'hard'
  trend: number[] // index history (oldest → newest)
  nextOut: number | null // differential that drops out next
  message: string
}
