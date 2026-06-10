import type {
  BagClub, CaddieAdvice, ClubId, Conditions, Hole, MissType, PlayerProfile,
} from '../types'
import { getClub, orderedBag } from '../data/clubs'
import { expectedStrokes } from './physicsEngine'
import { calculateAdjustedDistance, recommendClub } from './shotNormalization'
import { clamp, round1 } from './utils'

/**
 * The on-course caddie brain. Builds tee-shot and approach recommendations
 * from hole geometry, hazard pressure, the player's known miss, and a
 * simplified strokes-gained tradeoff between safe and aggressive lines.
 */

const RIGHT_MISSES: MissType[] = ['slice', 'push', 'thin']
const LEFT_MISSES: MissType[] = ['hook', 'pull']

export function missSide(miss: MissType): 'left' | 'right' | 'none' {
  if (RIGHT_MISSES.includes(miss)) return 'right'
  if (LEFT_MISSES.includes(miss)) return 'left'
  return 'none'
}

function hazardPressure(hole: Hole, side: 'left' | 'right'): number {
  let p = 0
  for (const h of hole.hazards) {
    if (h.side !== side) continue
    if (h.type === 'water' || h.type === 'ob') p += 0.6
    else if (h.type === 'creek') p += 0.4
    else if (h.type === 'trees') p += 0.3
    else p += 0.2
  }
  return clamp(p, 0, 1)
}

export function teeAdvice(hole: Hole, profile: PlayerProfile, bag: BagClub[], conditions: Conditions): CaddieAdvice {
  const clubs = orderedBag(bag).filter((c) => c.clubId !== 'PT')
  const driver = clubs.find((c) => c.clubId === 'DR') ?? clubs[0]
  const playerMiss = missSide(profile.commonMiss)
  const dangerSide = hazardPressure(hole, 'right') >= hazardPressure(hole, 'left') ? 'right' : 'left'
  const dangerP = hazardPressure(hole, dangerSide)
  const safeSide = dangerSide === 'right' ? 'left' : 'right'

  const cond = calculateAdjustedDistance(hole.yards, conditions, 'tee')

  if (hole.par === 3) {
    const rec = recommendClub(hole.yards, conditions, 'tee', bag)
    const club = getClub(rec.clubId)
    return {
      club: rec.clubId,
      altClub: rec.altClubId,
      target: dangerP > 0.3 ? `Center of the green, favoring the ${safeSide} half` : 'Center of the green',
      rationale: [
        `Plays like ${rec.playsLike} (card says ${hole.yards}).`,
        ...rec.reasons.slice(0, 2),
        dangerP > 0.3
          ? `Trouble is ${dangerSide}; the middle of the green wins this hole.`
          : `Green-light hole — your ${club.label} stock number fits.`,
      ],
      playsLike: rec.playsLike,
      riskLevel: Math.round(dangerP * 60),
      expectedStrokes: round1(expectedStrokes(hole.yards, 'tee', profile.handicap)),
      aggressive: {
        club: rec.clubId,
        target: 'At the flag',
        gain: 0.15,
        penaltyRisk: round1(dangerP * 0.5),
      },
    }
  }

  // Par 4/5 tee shot: does the player's miss pattern collide with the danger side?
  const missIntoDanger = playerMiss === dangerSide && dangerP >= 0.4
  const safeClub = pickLayupClub(clubs, hole, conditions)
  const driverRemaining = Math.max(40, cond.playsLike - driver.total)
  const safeRemaining = Math.max(40, cond.playsLike - safeClub.total)

  const driverES = expectedStrokes(driverRemaining, 'fairway', profile.handicap) + 1
  const safeES = expectedStrokes(safeRemaining, 'fairway', profile.handicap) + 1
  const rawGain = round1(safeES - driverES) // how much driver gains in strokes
  const penaltyRiskP = round1(clamp(dangerP * (missIntoDanger ? 0.85 : 0.4), 0, 0.95))
  const driverPenaltyCost = round1(penaltyRiskP * 1.3)

  const recommendSafe = missIntoDanger && driverPenaltyCost > rawGain
  const club = recommendSafe ? safeClub.clubId : driver.clubId
  const remaining = recommendSafe ? safeRemaining : driverRemaining

  const rationale: string[] = []
  if (recommendSafe) {
    rationale.push(
      `Do not chase driver here. Your ${profile.commonMiss} brings the ${describeDanger(hole, dangerSide)} into play.`,
      `${getClub(safeClub.clubId).label} at the ${safeSide}-center fairway leaves ~${remaining} in.`,
      `Driver only gains ${Math.max(rawGain, 0.1).toFixed(1)} expected strokes but adds ${driverPenaltyCost.toFixed(1)} of penalty risk.`,
    )
  } else {
    rationale.push(
      dangerP >= 0.4
        ? `Driver is fine — your miss pattern points away from the trouble ${dangerSide}.`
        : 'Wide-open driving hole. Send it.',
      `Favor the ${safeSide}-center line; expected remaining ~${remaining}.`,
    )
    if (conditions.windSpeed >= 10) rationale.push(windLine(conditions))
  }
  if (hole.elevationFt !== 0 && Math.abs(hole.elevationFt) >= 8) {
    rationale.push(`${Math.abs(hole.elevationFt)} ft ${hole.elevationFt > 0 ? 'uphill — the hole plays longer than the card' : 'downhill — free distance, pick the conservative line'}.`)
  }

  return {
    club,
    altClub: recommendSafe ? driver.clubId : safeClub.clubId,
    target: `${safeSide === 'left' ? 'Left' : 'Right'}-center of the fairway`,
    rationale,
    playsLike: cond.playsLike,
    riskLevel: Math.round((recommendSafe ? penaltyRiskP * 0.4 : penaltyRiskP) * 100),
    expectedStrokes: round1(Math.min(driverES, safeES) + (hole.par === 5 ? 1.6 : 0.9)),
    aggressive: {
      club: driver.clubId,
      target: `Driver over the ${safeSide} edge`,
      gain: Math.max(rawGain, 0.1),
      penaltyRisk: driverPenaltyCost,
    },
  }
}

export function approachAdvice(
  remaining: number,
  hole: Hole,
  profile: PlayerProfile,
  bag: BagClub[],
  conditions: Conditions,
  lie: 'fairway' | 'rough' | 'deep-rough' | 'bunker' | 'fringe' | 'recovery',
): CaddieAdvice {
  const rec = recommendClub(remaining, conditions, lie, bag)
  const playerMiss = missSide(profile.commonMiss)
  const dangerSide = hazardPressure(hole, 'right') >= hazardPressure(hole, 'left') ? 'right' : 'left'
  const dangerP = hazardPressure(hole, dangerSide)
  const safeSide = dangerSide === 'right' ? 'left' : 'right'

  const rationale = [
    `${remaining} to the pin plays like ${rec.playsLike}.`,
    ...rec.reasons.slice(0, 2),
  ]
  if (lie === 'rough' || lie === 'deep-rough') {
    rationale.push('From rough, expect less spin and more release — avoid short-siding yourself.')
  }
  if (playerMiss === dangerSide && dangerP >= 0.3) {
    rationale.push(`Your ${playerMiss} miss makes the ${describeDanger(hole, dangerSide)} the real danger. Aim ${safeSide}-center of the green.`)
  } else if (dangerP >= 0.3) {
    rationale.push(`Trouble ${dangerSide}, but your miss runs away from it — normal target.`)
  }
  if (conditions.slope === 'downhill' || conditions.slope === 'ball-below') {
    rationale.push('Downhill/below-feet lie raises thin risk. Choose the conservative target.')
  }

  return {
    club: rec.clubId,
    altClub: rec.altClubId,
    target: dangerP >= 0.3 ? `${safeSide === 'left' ? 'Left' : 'Right'}-center of the green` : 'Middle of the green',
    rationale,
    playsLike: rec.playsLike,
    riskLevel: Math.round(clamp(dangerP * (playerMiss === dangerSide ? 90 : 55), 5, 95)),
    expectedStrokes: round1(expectedStrokes(remaining, lie, profile.handicap)),
    aggressive: {
      club: rec.clubId,
      target: 'Pin-high at the flag',
      gain: 0.2,
      penaltyRisk: round1(dangerP * 0.6),
    },
  }
}

function pickLayupClub(clubs: BagClub[], hole: Hole, conditions: Conditions): BagClub {
  // Lay up short of the first cross/flanking hazard if one exists in driver range.
  const firstHazardAt = Math.min(
    ...hole.hazards.filter((h) => h.fromTee && h.fromTee > 150).map((h) => h.fromTee as number),
    Infinity,
  )
  const targetTotal = firstHazardAt !== Infinity ? firstHazardAt - 15 : 230
  let best = clubs[0]
  let bestErr = Infinity
  for (const c of clubs) {
    if (c.clubId === 'DR') continue
    const err = Math.abs(c.total - targetTotal)
    if (err < bestErr) {
      bestErr = err
      best = c
    }
  }
  return best
}

function describeDanger(hole: Hole, side: 'left' | 'right'): string {
  const h = hole.hazards.find((x) => x.side === side)
  if (!h) return `trouble ${side}`
  const names = { water: 'water', ob: 'OB', creek: 'creek', bunker: 'bunker', trees: 'trees', waste: 'waste area' }
  return `${names[h.type]} ${side}`
}

function windLine(c: Conditions): string {
  if (c.windDir === 'into') return `${c.windSpeed} mph into — take one more club and swing smooth.`
  if (c.windDir === 'down') return `${c.windSpeed} mph helping — expect extra rollout.`
  return `${c.windSpeed} mph crosswind — start it into the breeze and let it ride back.`
}

/** Quick label for the risk meter. */
export function riskLabel(risk: number): string {
  if (risk < 25) return 'Low risk'
  if (risk < 50) return 'Managed risk'
  if (risk < 75) return 'Elevated risk'
  return 'Danger zone'
}

export function clubLabel(id: ClubId): string {
  return getClub(id).label
}
