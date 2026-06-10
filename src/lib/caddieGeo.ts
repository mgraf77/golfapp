import type { BagClub, ClubId, ClubStats, PlayerProfile } from '../types'
import type { GeoHole, LatLng, WeatherSnapshot } from '../types/geo'
import { getClub, orderedBag } from '../data/clubs'
import { bearing, destinationYds, distYds, pointInRing, windComponents } from './geo'
import { baseline, mapLie } from './strokesGained'
import { clamp } from './utils'

/**
 * The GPS caddie. For every decision it:
 *  1. computes the true plays-like number (wind vector on the shot bearing,
 *     temperature, altitude-free baseline)
 *  2. builds a dispersion ellipse for each candidate club from the player's
 *     real logged shots (falling back to handicap-scaled defaults)
 *  3. Monte-Carlo samples landing positions against the actual course
 *     polygons (green, bunkers, water, fairway) and scores each aim point
 *     by expected strokes to hole out
 *  4. recommends the lowest-EV play, with the aggressive line priced
 *     honestly next to it.
 */

export interface PlaysLike {
  actual: number
  playsLike: number
  head: number // + into, − helping (mph)
  cross: number // + pushes left→right (mph)
  windEffect: number // yards
  tempEffect: number // yards
}

export interface GeoAimOption {
  label: string
  clubId: ClubId
  aim: LatLng
  ev: number // expected strokes from here, including this shot
  onGreenPct?: number
  troublePct: number
  note: string
}

export interface GeoAdvice {
  kind: 'tee' | 'approach' | 'short'
  playsLike: PlaysLike
  best: GeoAimOption
  aggressive: GeoAimOption | null
  safe: GeoAimOption | null
  rationale: string[]
  riskLevel: number // 0-100
}

// ── Plays-like ──────────────────────────────────────────────────────────

export function playsLikeGeo(
  actualYds: number,
  shotBearing: number,
  weather: WeatherSnapshot | null,
): PlaysLike {
  if (!weather) {
    return { actual: actualYds, playsLike: actualYds, head: 0, cross: 0, windEffect: 0, tempEffect: 0 }
  }
  const { head, cross } = windComponents(weather.windMph, weather.windFromDeg, shotBearing)
  // Into the wind hurts ~1% per mph; downwind helps ~0.5% per mph (ball-flight asymmetry)
  const windEffect = head > 0 ? actualYds * 0.010 * head : actualYds * 0.0055 * head
  // ~1 yard per 10°F away from 70°F on a 150y shot, scaled by distance
  const tempEffect = ((70 - weather.tempF) / 10) * (actualYds / 150)
  const playsLike = Math.round(actualYds + windEffect + tempEffect)
  return {
    actual: Math.round(actualYds),
    playsLike,
    head: Math.round(head),
    cross: Math.round(cross),
    windEffect: Math.round(windEffect),
    tempEffect: Math.round(tempEffect),
  }
}

// ── Dispersion model ────────────────────────────────────────────────────

interface Dispersion {
  carry: number
  sigmaLong: number
  sigmaLat: number
  biasLat: number // + means misses drift right
}

function dispersionFor(
  bagClub: BagClub,
  stats: ClubStats[] | undefined,
  profile: PlayerProfile,
): Dispersion {
  const stat = stats?.find((s) => s.clubId === bagClub.clubId && s.shots >= 5)
  const hcpFactor = clamp(1 + (profile.handicap - 8) * 0.035, 0.8, 2.0)
  const club = getClub(bagClub.clubId)
  const baseLat = bagClub.carry * (club.type === 'driver' ? 0.075 : club.type === 'wedge' ? 0.05 : 0.062)
  const sigmaLat = stat ? Math.max(stat.dispersion, 4) : baseLat * hcpFactor
  const sigmaLong = bagClub.carry * 0.05 * hcpFactor
  const missDir =
    ['slice', 'push', 'thin'].includes(profile.commonMiss) ? 1 :
    ['hook', 'pull'].includes(profile.commonMiss) ? -1 : 0
  return {
    carry: stat ? stat.carry : bagClub.carry,
    sigmaLong,
    sigmaLat,
    biasLat: missDir * sigmaLat * 0.45 * (profile.hand === 'left' ? -1 : 1),
  }
}

// deterministic gaussian pairs so advice doesn't flicker between renders
function seededGaussians(n: number, seed: number): { a: number; b: number }[] {
  let s = seed >>> 0 || 1
  const rand = () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
  const out: { a: number; b: number }[] = []
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(rand(), 1e-9)
    const u2 = rand()
    const m = Math.sqrt(-2 * Math.log(u1))
    out.push({ a: m * Math.cos(2 * Math.PI * u2), b: m * Math.sin(2 * Math.PI * u2) })
  }
  return out
}

// ── Landing evaluation ──────────────────────────────────────────────────

const SAMPLES = 72

interface EvalResult {
  ev: number
  onGreenPct: number
  troublePct: number
}

function evaluateAim(
  pos: LatLng,
  aim: LatLng,
  disp: Dispersion,
  hole: GeoHole,
  pin: LatLng,
  weather: WeatherSnapshot | null,
  seed: number,
): EvalResult {
  const aimBearing = bearing(pos, aim)
  const aimDist = distYds(pos, aim)
  const pl = playsLikeGeo(aimDist, aimBearing, weather)
  // wind drift moves the landing point laterally ~0.55 yd per mph-cross per 100y
  const drift = (pl.cross * 0.55 * aimDist) / 100
  const gauss = seededGaussians(SAMPLES, seed)

  let evSum = 0
  let green = 0
  let trouble = 0
  for (const g of gauss) {
    const long = g.a * disp.sigmaLong - (pl.playsLike - pl.actual) * 0.35 // under-clubbing into wind shows up long/short
    const lat = g.b * disp.sigmaLat + disp.biasLat + drift
    const dist = aimDist + long
    const angleOff = (Math.atan2(lat, Math.max(dist, 20)) * 180) / Math.PI
    const land = destinationYds(pos, aimBearing + angleOff, Math.max(15, Math.hypot(dist, lat)))

    const toPin = distYds(land, pin)
    let es: number
    if (hole.greenRing && pointInRing(land, hole.greenRing)) {
      es = baseline('green', Math.max(2, toPin * 3)) // yards → feet
      green++
    } else {
      let lie: 'fairway' | 'rough' | 'sand' | 'recovery' = 'rough'
      let penalty = 0
      for (const hz of hole.hazards) {
        if (!pointInRing(land, hz.ring)) continue
        if (hz.type === 'water') {
          penalty = 1
          trouble++
          break
        }
        if (hz.type === 'bunker') lie = 'sand'
        if (hz.type === 'fairway') lie = 'fairway'
      }
      if (penalty) {
        es = 1 + baseline('fairway', Math.min(toPin + 20, 250)) // drop + distance
      } else {
        if (lie === 'sand') trouble += 0.4
        es = baseline(lie, Math.max(8, toPin))
      }
    }
    evSum += es
  }
  return {
    ev: 1 + evSum / SAMPLES,
    onGreenPct: Math.round((green / SAMPLES) * 100),
    troublePct: Math.round((trouble / SAMPLES) * 100),
  }
}

// ── Public advice API ───────────────────────────────────────────────────

export function adviseGeoShot(
  pos: LatLng,
  hole: GeoHole,
  pin: LatLng,
  bag: BagClub[],
  stats: ClubStats[] | undefined,
  weather: WeatherSnapshot | null,
  profile: PlayerProfile,
  lie: string = 'fairway',
): GeoAdvice {
  const pinDist = distYds(pos, pin)
  const shotBearing = bearing(pos, pin)
  const pl = playsLikeGeo(pinDist, shotBearing, weather)
  const clubs = orderedBag(bag).filter((c) => c.clubId !== 'PT')
  const longest = clubs[0]
  const seedBase = Math.round(pos.lat * 1e5 + pos.lng * 1e5 + pinDist)

  const lieFactor = { rough: 0.93, 'deep-rough': 0.82, bunker: 0.85, recovery: 0.7 }[lie] ?? 1

  // ── Mode: green is reachable → optimize aim on/around the green ──
  if (pl.playsLike <= longest.carry * lieFactor + 25 && pinDist <= 280) {
    // candidate clubs: the two whose adjusted carry brackets plays-like
    const target = pl.playsLike / lieFactor
    const sorted = [...clubs].sort((a, b) => Math.abs(a.carry - target) - Math.abs(b.carry - target))
    const candidates = sorted.slice(0, 3)

    const aims: { label: string; aim: LatLng; pinShot: boolean }[] = [{ label: 'At the pin', aim: pin, pinShot: true }]
    if (hole.greenRing) {
      const centerAim = hole.greenCenter
      if (distYds(centerAim, pin) > 7) aims.push({ label: 'Center of the green', aim: centerAim, pinShot: false })
      // fat side: shift center away from short-side trouble
      const away = destinationYds(centerAim, hole.bearing + 90, 8)
      const away2 = destinationYds(centerAim, hole.bearing - 90, 8)
      aims.push({ label: 'Fat side', aim: away, pinShot: false }, { label: 'Fat side', aim: away2, pinShot: false })
    }

    let options: GeoAimOption[] = []
    for (const club of candidates) {
      const disp = dispersionFor(club, stats, profile)
      disp.carry *= lieFactor
      for (const a of aims) {
        const r = evaluateAim(pos, a.aim, disp, hole, pin, weather, seedBase + club.carry)
        options.push({
          label: a.label,
          clubId: club.clubId,
          aim: a.aim,
          ev: Math.round(r.ev * 100) / 100,
          onGreenPct: r.onGreenPct,
          troublePct: r.troublePct,
          note: `${getClub(club.clubId).short} · ${r.onGreenPct}% green · ${r.troublePct}% trouble`,
        })
      }
    }
    options = options.sort((x, y) => x.ev - y.ev)
    const best = options[0]
    const aggressive = options.find((o) => o.label === 'At the pin' && o !== best) ?? null
    const safe = options.find((o) => o.label !== 'At the pin' && o !== best) ?? null

    const rationale = buildApproachRationale(pl, best, aggressive, lie, weather, hole)
    return {
      kind: pinDist <= 60 ? 'short' : 'approach',
      playsLike: pl,
      best,
      aggressive,
      safe,
      rationale,
      riskLevel: clamp(best.troublePct + Math.max(0, 40 - (best.onGreenPct ?? 0)) / 2, 3, 95),
    }
  }

  // ── Mode: tee shot / layup → optimize landing spot along the corridor ──
  const corridor = hole.line
  const candidates = clubs.filter((c) => c.carry >= 120 || c === longest).slice(0, 5)
  let options: GeoAimOption[] = []
  for (const club of candidates) {
    const disp = dispersionFor(club, stats, profile)
    disp.carry *= lieFactor
    const aim = pointAlong(corridor, pos, disp.carry)
    const r = evaluateAim(pos, aim, disp, hole, pin, weather, seedBase + club.carry * 3)
    options.push({
      label: `${getClub(club.clubId).label} to ${Math.round(Math.max(0, pinDist - disp.carry))} in`,
      clubId: club.clubId,
      aim,
      ev: Math.round(r.ev * 100) / 100,
      troublePct: r.troublePct,
      note: `${r.troublePct}% trouble · leaves ~${Math.round(Math.max(30, pinDist - disp.carry))}`,
      onGreenPct: r.onGreenPct,
    })
  }
  options = options.sort((x, y) => x.ev - y.ev)
  const best = options[0]
  const longestOpt = options.find((o) => o.clubId === candidates[0].clubId) ?? best
  const aggressive = longestOpt !== best ? longestOpt : null
  const safe = options.find((o) => o !== best && o.troublePct < best.troublePct) ?? null

  const rationale = buildTeeRationale(pl, best, aggressive, options, weather, profile)
  return {
    kind: 'tee',
    playsLike: pl,
    best,
    aggressive,
    safe,
    rationale,
    riskLevel: clamp(best.troublePct * 1.5, 3, 95),
  }
}

/** Point along the hole centerline at a given distance from the player. */
function pointAlong(line: LatLng[], from: LatLng, yds: number): LatLng {
  // walk the polyline from the vertex nearest the player
  let startIdx = 0
  let bestD = Infinity
  for (let i = 0; i < line.length; i++) {
    const d = distYds(from, line[i])
    if (d < bestD) {
      bestD = d
      startIdx = i
    }
  }
  let remaining = yds
  let cur = from
  for (let i = startIdx + 1; i < line.length; i++) {
    const seg = distYds(cur, line[i])
    if (seg >= remaining) return destinationYds(cur, bearing(cur, line[i]), remaining)
    remaining -= seg
    cur = line[i]
  }
  const endBearing = line.length >= 2 ? bearing(line[line.length - 2], line[line.length - 1]) : 0
  return destinationYds(cur, endBearing, remaining)
}

function windSentence(pl: PlaysLike, weather: WeatherSnapshot | null): string | null {
  if (!weather || weather.windMph < 4) return null
  const dir = pl.head > 2 ? `${Math.abs(pl.head)} mph into you` : pl.head < -2 ? `${Math.abs(pl.head)} mph helping` : null
  const cross = Math.abs(pl.cross) > 3 ? `${Math.abs(pl.cross)} mph pushing ${pl.cross > 0 ? 'left-to-right' : 'right-to-left'}` : null
  const parts = [dir, cross].filter(Boolean)
  if (!parts.length) return null
  return `Wind: ${parts.join(', ')}${Math.abs(pl.cross) > 3 ? ` — start it ${pl.cross > 0 ? 'left' : 'right'} edge and let it ride.` : '.'}`
}

function buildApproachRationale(
  pl: PlaysLike,
  best: GeoAimOption,
  aggressive: GeoAimOption | null,
  lie: string,
  weather: WeatherSnapshot | null,
  hole: GeoHole,
): string[] {
  const out: string[] = []
  if (pl.playsLike !== pl.actual) {
    const why = [
      pl.windEffect ? `${pl.windEffect > 0 ? '+' : ''}${pl.windEffect} wind` : '',
      pl.tempEffect ? `${pl.tempEffect > 0 ? '+' : ''}${pl.tempEffect} temp` : '',
    ].filter(Boolean).join(', ')
    out.push(`${pl.actual} plays like ${pl.playsLike}${why ? ` (${why})` : ''}.`)
  } else {
    out.push(`${pl.actual} to the pin, no adjustment needed.`)
  }
  const w = windSentence(pl, weather)
  if (w) out.push(w)
  if (lie !== 'fairway' && lie !== 'tee') {
    out.push(
      lie === 'bunker' ? 'From sand: ball-first contact, take one extra club, smooth tempo.' :
      lie === 'deep-rough' ? 'Deep rough kills spin — this is a position shot, not a hero shot.' :
      'From the rough expect ~7% less carry and more rollout.',
    )
  }
  out.push(`${best.label} is the math play: ${best.onGreenPct}% green in regulation, ${best.troublePct}% trouble.`)
  if (aggressive && aggressive.ev - best.ev > 0.05) {
    out.push(`Pin-hunting costs ${(aggressive.ev - best.ev).toFixed(2)} strokes of EV here — only take it if you need it.`)
  } else if (aggressive && best.label === 'At the pin') {
    out.push('Green light — the pin IS the right target from this number.')
  }
  if (hole.hazards.some((h) => h.type === 'water')) out.push('Water in play: a wet ball costs a full stroke plus the drop. Respect it.')
  return out
}

function buildTeeRationale(
  pl: PlaysLike,
  best: GeoAimOption,
  aggressive: GeoAimOption | null,
  options: GeoAimOption[],
  weather: WeatherSnapshot | null,
  profile: PlayerProfile,
): string[] {
  const out: string[] = []
  out.push(`${pl.actual} to the green${pl.playsLike !== pl.actual ? `, playing ${pl.playsLike}` : ''}.`)
  const w = windSentence(pl, weather)
  if (w) out.push(w)
  if (aggressive && aggressive.ev - best.ev > 0.07) {
    out.push(
      `${best.label.split(' to ')[0]} beats the longer club by ${(aggressive.ev - best.ev).toFixed(2)} expected strokes — ` +
      `the extra distance isn't worth ${aggressive.troublePct}% trouble with your ${profile.commonMiss} in the bag.`,
    )
  } else {
    out.push(`Longest sensible club wins this hole: only ${best.troublePct}% of your shot cone finds trouble.`)
  }
  const safest = [...options].sort((a, b) => a.troublePct - b.troublePct)[0]
  if (safest !== best && best.troublePct > 15) {
    out.push(`If you're protecting a score: ${safest.label} drops trouble to ${safest.troublePct}%.`)
  }
  return out
}
