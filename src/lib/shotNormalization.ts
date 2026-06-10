import type {
  Adjustment, BagClub, ClubId, Conditions, Lie, LoggedShot, NormalizedShot, ShotInput,
} from '../types'
import { getClub, orderedBag } from '../data/clubs'
import {
  CONTACT_FACTORS, SHAPE_INFO, elevationEffect, firmnessEffect, lieEffect,
  slopeEffect, temperatureEffect, windEffect,
} from './physicsEngine'
import { clamp, round1 } from './utils'

/**
 * Normalized Shot Data Engine.
 *
 * Takes a raw shot (what actually happened, in the conditions it happened in)
 * and back-calculates the "true neutral" value: what this swing was worth in
 * calm wind, flat ground, 70°F, normal turf, off a fairway lie.
 *
 * That neutral number — not the raw one — is what feeds club averages,
 * confidence scores, and caddie recommendations. A 300-yard drive downhill,
 * downwind, on firm turf is NOT a 300-yard driver swing, and the app should
 * never pretend it is.
 */

export function normalizeShot(input: ShotInput): NormalizedShot {
  const { actualDistance, conditions, lie, contact, shape, clubId } = input
  const isDriver = clubId === 'DR'
  const adjustments: Adjustment[] = []

  // 1. Environmental effects on the RAW number (we subtract their help / add back their harm)
  const wind = windEffect(actualDistance, conditions.windSpeed, conditions.windDir)
  if (wind.yards !== 0) adjustments.push({ factor: 'Wind', yards: round1(wind.yards), note: wind.note })

  const elev = elevationEffect(conditions.elevationFt)
  if (elev.yards !== 0) adjustments.push({ factor: 'Elevation', yards: round1(elev.yards), note: elev.note })

  const temp = temperatureEffect(actualDistance, conditions.tempF)
  if (temp.yards !== 0) adjustments.push({ factor: 'Temperature', yards: round1(temp.yards), note: temp.note })

  const firm = firmnessEffect(actualDistance, conditions.firmness, conditions.wet, isDriver)
  const baselineRoll = isDriver ? actualDistance * 0.09 : actualDistance * 0.04
  const rollDelta = firm.roll - baselineRoll
  if (Math.abs(rollDelta) > 1.5) {
    adjustments.push({ factor: 'Turf / rollout', yards: round1(rollDelta), note: firm.note })
  }

  // 2. Lie & slope penalties (these HURT the raw number; neutral value adds them back)
  const lieAdj = lieEffect(actualDistance, lie)
  if (lieAdj.yards !== 0) adjustments.push({ factor: 'Lie', yards: round1(lieAdj.yards), note: lieAdj.note })

  const slopeAdj = slopeEffect(actualDistance, conditions.slope)
  if (slopeAdj.yards !== 0) adjustments.push({ factor: 'Stance slope', yards: round1(slopeAdj.yards), note: slopeAdj.note })

  // 3. Strike & shape — these tell us about the swing itself, not the environment.
  const strikeFactor = CONTACT_FACTORS[contact].mult
  const shapeInfo = SHAPE_INFO[shape]

  // Neutral total = raw, minus environmental help, plus environmental harm.
  const envEffect = wind.yards + elev.yards + temp.yards + rollDelta + lieAdj.yards + slopeAdj.yards
  let normalizedTotal = actualDistance - envEffect

  // Shape spin loss (slice/hook) is a swing trait: keep it in the neutral
  // number — the player really does carry it everywhere — but report it.
  if (shapeInfo.carryMult < 0.97) {
    adjustments.push({
      factor: 'Curvature',
      yards: round1(-normalizedTotal * (1 - shapeInfo.carryMult)),
      note: shapeInfo.note,
    })
  }

  normalizedTotal = clamp(normalizedTotal, actualDistance * 0.4, actualDistance * 1.8)
  const normalizedCarry = normalizedTotal * (isDriver ? 0.915 : 0.962)

  return {
    rawDistance: actualDistance,
    normalizedCarry: Math.round(normalizedCarry),
    normalizedTotal: Math.round(normalizedTotal),
    adjustments,
    strikeFactor,
    summary: summarize(input, Math.round(normalizedTotal), adjustments),
  }
}

function summarize(input: ShotInput, normalizedTotal: number, adjustments: Adjustment[]): string {
  const club = getClub(input.clubId)
  const delta = input.actualDistance - normalizedTotal
  if (adjustments.length === 0 || Math.abs(delta) < 4) {
    return `Clean read: this ${club.label.toLowerCase()} played its true number — ${normalizedTotal} yds neutral.`
  }
  const helped = delta > 0
  const top = [...adjustments].sort((a, b) => Math.abs(b.yards) - Math.abs(a.yards))[0]
  return helped
    ? `This was not really a ${input.actualDistance}-yard ${club.label.toLowerCase()}. Conditions (${top.factor.toLowerCase()}) flattered it by ~${Math.abs(Math.round(delta))} yds. True neutral value: ${normalizedTotal} yds.`
    : `Better than it looked: conditions (${top.factor.toLowerCase()}) cost ~${Math.abs(Math.round(delta))} yds. Neutral value: ${normalizedTotal} yds.`
}

// ── "Plays like" distance for the caddie (forward direction) ───────────

export function calculateAdjustedDistance(targetDistance: number, conditions: Conditions, lie: Lie): {
  playsLike: number
  reasons: string[]
} {
  const reasons: string[] = []
  let d = targetDistance

  const wind = windEffect(targetDistance, conditions.windSpeed, conditions.windDir)
  d -= wind.yards
  if (wind.yards !== 0) reasons.push(wind.note.replace('cost', 'adds').replace('added', 'subtracts'))

  const elev = elevationEffect(conditions.elevationFt)
  d -= elev.yards
  if (elev.yards !== 0) reasons.push(elev.note)

  const temp = temperatureEffect(targetDistance, conditions.tempF)
  d -= temp.yards
  if (temp.yards !== 0) reasons.push(temp.note)

  const lieAdj = lieEffect(targetDistance, lie)
  if (lieAdj.yards !== 0) {
    d -= lieAdj.yards
    reasons.push(lieAdj.note)
  }

  return { playsLike: Math.round(d), reasons }
}

// ── Club confidence ─────────────────────────────────────────────────────

/**
 * Confidence = consistency of normalized outcomes vs. the club's stock
 * number, discounted by sample size and severe-miss rate.
 */
export function estimateClubConfidence(shots: LoggedShot[], stockTotal: number): number {
  if (shots.length === 0) return 50
  const errors = shots.map((s) => Math.abs(s.normalized.normalizedTotal - stockTotal) / Math.max(stockTotal, 1))
  const meanErr = errors.reduce((a, b) => a + b, 0) / errors.length
  // Penalties and big curvature count as severe; slice/hook shapes at half weight.
  const severeMisses = shots.reduce(
    (a, s) =>
      a +
      (s.normalized.strikeFactor < 0.8 || ['water', 'ob'].includes(s.outcome)
        ? 1
        : ['slice', 'hook'].includes(s.shape)
          ? 0.5
          : 0),
    0,
  )
  const severeMissRate = severeMisses / shots.length
  const sampleBoost = clamp(shots.length / 12, 0.4, 1)
  const score = (1 - clamp(meanErr * 3.2, 0, 0.7)) * (1 - severeMissRate * 0.9) * sampleBoost * 100 + (1 - sampleBoost) * 50
  return Math.round(clamp(score, 5, 98))
}

// ── Miss pattern detection ──────────────────────────────────────────────

export interface MissPattern {
  label: string
  lateral: 'left' | 'right' | 'neutral'
  depth: 'short' | 'long' | 'neutral'
  confidence: number // 0-100, rises with sample and consistency
}

export function detectMissPattern(shots: Pick<LoggedShot, 'line' | 'actualDistance' | 'intendedDistance' | 'contact'>[]): MissPattern {
  if (shots.length < 3) return { label: 'Not enough data yet', lateral: 'neutral', depth: 'neutral', confidence: 0 }

  const lefts = shots.filter((s) => s.line === 'left').length
  const rights = shots.filter((s) => s.line === 'right').length
  const shorts = shots.filter((s) => s.actualDistance < s.intendedDistance - 7).length
  const longs = shots.filter((s) => s.actualDistance > s.intendedDistance + 7).length
  const n = shots.length

  const lateral = rights / n > 0.4 ? 'right' : lefts / n > 0.4 ? 'left' : 'neutral'
  const depth = shorts / n > 0.4 ? 'short' : longs / n > 0.35 ? 'long' : 'neutral'
  const dominant = Math.max(rights, lefts, shorts) / n
  const confidence = Math.round(clamp(dominant * 100 * clamp(n / 10, 0.5, 1), 0, 95))

  let label: string
  if (lateral === 'neutral' && depth === 'neutral') label = 'Balanced dispersion'
  else if (lateral !== 'neutral' && depth !== 'neutral') label = `${depth}-${lateral}`
  else if (lateral !== 'neutral') label = `Misses ${lateral}`
  else label = `Misses ${depth}`

  return { label, lateral, depth, confidence }
}

// ── Club recommendation ─────────────────────────────────────────────────

export function recommendClub(
  targetDistance: number,
  conditions: Conditions,
  lie: Lie,
  bag: BagClub[],
): { clubId: ClubId; playsLike: number; reasons: string[]; altClubId?: ClubId } {
  const { playsLike, reasons } = calculateAdjustedDistance(targetDistance, conditions, lie)
  const candidates = orderedBag(bag).filter((b) => b.clubId !== 'PT')

  // Into the wind we prefer the lower-launching (longer) club swung easier.
  const intoWind = conditions.windDir === 'into' && conditions.windSpeed >= 8
  let best = candidates[candidates.length - 1]
  let bestErr = Infinity
  for (const c of candidates) {
    const err = Math.abs(c.total - playsLike) + (intoWind && c.total < playsLike ? 6 : 0)
    if (err < bestErr) {
      bestErr = err
      best = c
    }
  }
  if (intoWind) reasons.push('Into wind: prioritize the lower-launch club. Take more club and swing 80%.')

  const idx = candidates.findIndex((c) => c.clubId === best.clubId)
  const alt = candidates[idx + (best.total >= playsLike ? 1 : -1)]
  return { clubId: best.clubId, playsLike, reasons, altClubId: alt?.clubId }
}
