import type { Conditions, Contact, Lie, ShotShape, SlopeLie, WindDir } from '../types'

/**
 * Prototype golf physics layer.
 *
 * Every function returns yards of effect (or a multiplier) plus a short
 * human-readable note, so the normalization engine and the caddie can
 * always explain WHY a number moved. The coefficients are simplified but
 * directionally faithful to real ball-flight behavior.
 */

// ── Wind ────────────────────────────────────────────────────────────────

/**
 * Headwind hurts roughly 1% of shot distance per mph (it amplifies spin/lift),
 * tailwind helps ~0.5% per mph (it flattens the flight, less efficient).
 * Crosswind costs a small amount of carry plus lateral drift.
 */
export function windEffect(distance: number, windSpeed: number, windDir: WindDir) {
  if (windDir === 'calm' || windSpeed === 0) {
    return { yards: 0, lateral: 0, note: 'Calm conditions — no wind adjustment.' }
  }
  if (windDir === 'into') {
    const yards = -distance * 0.01 * windSpeed
    return {
      yards,
      lateral: 0,
      note: `${windSpeed} mph headwind cost ~${Math.abs(Math.round(yards))} yds (wind amplifies spin and ballooning).`,
    }
  }
  if (windDir === 'down') {
    const yards = distance * 0.005 * windSpeed
    return {
      yards,
      lateral: 0,
      note: `${windSpeed} mph tailwind added ~${Math.round(yards)} yds (flatter, more efficient flight).`,
    }
  }
  // crosswind
  const lateral = distance * 0.004 * windSpeed * (windDir === 'cross-left' ? -1 : 1)
  const yards = -distance * 0.002 * windSpeed
  return {
    yards,
    lateral,
    note: `${windSpeed} mph crosswind drifted the ball ~${Math.abs(Math.round(lateral))} yds ${windDir === 'cross-left' ? 'left' : 'right'} and cost a little carry.`,
  }
}

// ── Elevation ───────────────────────────────────────────────────────────

/** Rule of thumb: every 15 ft of elevation change ≈ 5 yards of effective distance. */
export function elevationEffect(elevationFt: number) {
  const yards = -(elevationFt / 15) * 5
  if (Math.abs(elevationFt) < 3) return { yards: 0, note: 'Flat — no elevation adjustment.' }
  return {
    yards,
    note:
      elevationFt > 0
        ? `${elevationFt} ft uphill played ~${Math.abs(Math.round(yards))} yds longer.`
        : `${Math.abs(elevationFt)} ft downhill played ~${Math.abs(Math.round(yards))} yds shorter (added carry/rollout).`,
  }
}

// ── Lie ─────────────────────────────────────────────────────────────────

const LIE_FACTORS: Record<Lie, { mult: number; spinLoss: number; note: string }> = {
  tee: { mult: 1.0, spinLoss: 0, note: 'Teed ball — clean strike conditions.' },
  fairway: { mult: 1.0, spinLoss: 0, note: 'Fairway lie — full control available.' },
  fringe: { mult: 1.0, spinLoss: 0.05, note: 'Fringe lie — near-full control.' },
  rough: { mult: 0.92, spinLoss: 0.35, note: 'Rough costs ~8% carry and most of your spin — expect release.' },
  'deep-rough': { mult: 0.8, spinLoss: 0.6, note: 'Deep rough: ~20% carry penalty. Advancing it is the win.' },
  bunker: { mult: 0.85, spinLoss: 0.25, note: 'Fairway bunker: clean contact first, distance second (~15% penalty).' },
  recovery: { mult: 0.6, spinLoss: 0.5, note: 'Recovery lie — punch out, take your medicine.' },
}

export function lieEffect(distance: number, lie: Lie) {
  const f = LIE_FACTORS[lie]
  return { yards: -distance * (1 - f.mult), spinLoss: f.spinLoss, note: f.note }
}

// ── Slope of the stance ─────────────────────────────────────────────────

const SLOPE_FACTORS: Record<SlopeLie, { mult: number; bias: string; note: string }> = {
  flat: { mult: 1, bias: 'none', note: 'Flat stance.' },
  uphill: { mult: 0.95, bias: 'left', note: 'Uphill lie adds loft (~5% shorter) and pulls the ball left.' },
  downhill: { mult: 0.97, bias: 'right', note: 'Downhill lie delofts the club, raises thin risk, pushes the ball right.' },
  'ball-above': { mult: 0.98, bias: 'left', note: 'Ball above feet flattens the swing — expect a draw/pull.' },
  'ball-below': { mult: 0.97, bias: 'right', note: 'Ball below feet — expect a fade/push and thin risk.' },
}

export function slopeEffect(distance: number, slope: SlopeLie) {
  const f = SLOPE_FACTORS[slope]
  return { yards: -distance * (1 - f.mult), bias: f.bias, note: f.note }
}

// ── Temperature ─────────────────────────────────────────────────────────

/** ~1 yard per 10°F away from 70°F per 150 yds of shot. */
export function temperatureEffect(distance: number, tempF: number) {
  const yards = ((tempF - 70) / 10) * (distance / 150)
  if (Math.abs(tempF - 70) < 8) return { yards: 0, note: 'Neutral temperature.' }
  return {
    yards,
    note:
      tempF > 70
        ? `Warm air (${tempF}°F) added ~${Math.round(yards)} yds.`
        : `Cold air (${tempF}°F) cost ~${Math.abs(Math.round(yards))} yds (denser air, less ball speed).`,
  }
}

// ── Firmness / moisture (affects roll, not carry) ──────────────────────

export function firmnessEffect(carry: number, firmness: Conditions['firmness'], wet: boolean, isDriver: boolean) {
  let roll = isDriver ? carry * 0.09 : carry * 0.04
  let note = 'Normal turf — standard rollout.'
  if (firmness === 'firm') {
    roll *= 2.1
    note = `Firm turf added ~${Math.round(roll)} yds of rollout — flattering but not repeatable carry.`
  } else if (firmness === 'soft' || wet) {
    roll *= 0.3
    note = wet ? 'Wet turf killed rollout — the ball played its carry number only.' : 'Soft turf — minimal rollout.'
  }
  return { roll, note }
}

// ── Strike quality ──────────────────────────────────────────────────────

export const CONTACT_FACTORS: Record<Contact, { mult: number; note: string }> = {
  pure: { mult: 1.0, note: 'Flushed — this strike represents your true speed.' },
  toe: { mult: 0.93, note: 'Toe strike: ~7% ball-speed loss with gear-effect draw spin.' },
  heel: { mult: 0.93, note: 'Heel strike: ~7% loss with gear-effect fade spin.' },
  thin: { mult: 0.9, note: 'Thin: low launch, low spin — runs out but unreliable carry (~10% loss).' },
  fat: { mult: 0.75, note: 'Fat: ground-first contact dumped ~25% of the energy.' },
  topped: { mult: 0.4, note: 'Topped — almost all carry lost.' },
  shank: { mult: 0.5, note: 'Hosel contact — direction and distance both forfeit.' },
}

// ── Shot shape ──────────────────────────────────────────────────────────

export const SHAPE_INFO: Record<ShotShape, { carryMult: number; lateral: 'left' | 'right' | 'none'; note: string }> = {
  straight: { carryMult: 1.0, lateral: 'none', note: 'Started on line, stayed on line.' },
  draw: { carryMult: 1.01, lateral: 'left', note: 'Drawing flight — slightly hotter with more release.' },
  fade: { carryMult: 0.99, lateral: 'right', note: 'Fading flight — softer landing, slightly less carry.' },
  slice: { carryMult: 0.88, lateral: 'right', note: 'Slice spin bled ~12% of carry — an open face at impact.' },
  hook: { carryMult: 0.93, lateral: 'left', note: 'Hook spin: low, hot, and left — closed face relative to path.' },
  push: { carryMult: 1.0, lateral: 'right', note: 'Pushed — path and face both right; full distance, wrong line.' },
  pull: { carryMult: 1.0, lateral: 'left', note: 'Pulled — path and face both left; full distance, wrong line.' },
}

// ── Strokes-gained style risk model (simplified) ───────────────────────

/**
 * Expected strokes to hole out from a distance/lie, fitted loosely to
 * PGA-Tour-shaped curves and shifted by handicap.
 */
export function expectedStrokes(distance: number, lie: Lie, handicap: number): number {
  let base: number
  if (distance <= 0) return 0
  if (lie === 'recovery') base = 3.4
  else if (distance < 8) base = 1.5
  else if (distance < 30) base = 2.1
  else if (distance < 60) base = 2.5
  else if (distance < 100) base = 2.75
  else if (distance < 150) base = 2.95
  else if (distance < 200) base = 3.2
  else if (distance < 250) base = 3.5
  else if (distance < 320) base = 3.85
  else base = 4.2
  const lieAdj = lie === 'rough' ? 0.18 : lie === 'deep-rough' ? 0.45 : lie === 'bunker' ? 0.35 : 0
  const hcpAdj = handicap * 0.022 * (distance > 30 ? 1 : 0.5)
  return base + lieAdj + hcpAdj
}

/** Rough penalty probability for a target line given hazard pressure (0-1). */
export function penaltyRisk(hazardPressure: number, dispersionYds: number, distanceToHazard: number): number {
  const exposure = clamp01(1 - distanceToHazard / (dispersionYds * 2.5))
  return clamp01(hazardPressure * (0.25 + exposure * 0.75))
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}
