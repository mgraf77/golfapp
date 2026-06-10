import type { LoggedShot, Round } from '../types'

/**
 * Strokes-gained engine built on Mark Broadie's published PGA Tour expected
 * strokes baselines (Every Shot Counts). Linear interpolation between
 * anchor distances; lies map onto the closest baseline table.
 */

type SgLie = 'tee' | 'fairway' | 'rough' | 'sand' | 'recovery' | 'green'

// [yards, expected strokes to hole out] — PGA Tour scratch baseline
const TEE: [number, number][] = [
  [100, 2.92], [120, 2.99], [140, 2.97], [160, 2.99], [180, 3.05], [200, 3.12],
  [220, 3.17], [240, 3.25], [260, 3.45], [280, 3.65], [300, 3.71], [320, 3.79],
  [340, 3.86], [360, 3.92], [380, 3.96], [400, 3.99], [420, 4.02], [440, 4.08],
  [460, 4.17], [480, 4.28], [500, 4.41], [520, 4.54], [540, 4.65], [560, 4.74],
  [580, 4.79], [600, 4.82],
]
const FAIRWAY: [number, number][] = [
  [10, 2.18], [20, 2.40], [40, 2.60], [60, 2.70], [80, 2.75], [100, 2.80],
  [120, 2.85], [140, 2.91], [160, 2.98], [180, 3.08], [200, 3.19], [220, 3.32],
  [240, 3.42], [260, 3.53], [280, 3.62], [300, 3.71],
]
const ROUGH: [number, number][] = [
  [10, 2.34], [20, 2.59], [40, 2.78], [60, 2.91], [80, 2.96], [100, 3.02],
  [120, 3.08], [140, 3.15], [160, 3.23], [180, 3.31], [200, 3.42], [220, 3.53],
  [240, 3.64], [260, 3.74], [280, 3.83], [300, 3.90],
]
const SAND: [number, number][] = [
  [10, 2.43], [20, 2.53], [40, 2.82], [60, 3.15], [80, 3.24], [100, 3.23],
  [120, 3.21], [140, 3.22], [160, 3.28], [180, 3.40], [200, 3.55], [220, 3.70],
  [240, 3.84], [260, 3.93], [280, 4.00], [300, 4.04],
]
const RECOVERY: [number, number][] = [
  [60, 3.56], [100, 3.80], [140, 4.00], [180, 4.20], [220, 4.40], [260, 4.60], [300, 4.80],
]
// putting baseline keyed by FEET
const GREEN_FT: [number, number][] = [
  [1, 1.00], [2, 1.01], [3, 1.05], [4, 1.13], [5, 1.23], [6, 1.34], [7, 1.42],
  [8, 1.50], [9, 1.56], [10, 1.61], [12, 1.69], [15, 1.78], [20, 1.87],
  [25, 1.93], [30, 1.98], [40, 2.06], [50, 2.14], [60, 2.21], [90, 2.40],
]

const TABLES: Record<Exclude<SgLie, 'green'>, [number, number][]> = {
  tee: TEE, fairway: FAIRWAY, rough: ROUGH, sand: SAND, recovery: RECOVERY,
}

function interp(table: [number, number][], x: number): number {
  if (x <= table[0][0]) return table[0][1]
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const [x0, y0] = table[i - 1]
      const [x1, y1] = table[i]
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
    }
  }
  const last = table[table.length - 1]
  return last[1] + (x - last[0]) * 0.004 // gentle extrapolation
}

/** Expected strokes to hole out from `yards` (or feet on green) at scratch baseline. */
export function baseline(lie: SgLie, dist: number): number {
  if (lie === 'green') return interp(GREEN_FT, dist) // dist in feet
  if (lie === 'tee' && dist < 100) return interp(FAIRWAY, dist) // short par 3 ≈ fairway
  return interp(TABLES[lie], dist)
}

export function mapLie(lie: string): SgLie {
  switch (lie) {
    case 'tee': return 'tee'
    case 'fairway': case 'fringe': return 'fairway'
    case 'rough': return 'rough'
    case 'deep-rough': case 'recovery': return 'recovery'
    case 'bunker': case 'sand': return 'sand'
    case 'green': return 'green'
    default: return 'fairway'
  }
}

/**
 * SG for one shot: baseline(before) − baseline(after) − 1.
 * Positive = better than a scratch tour pro from that spot.
 */
export function strokesGainedShot(
  before: { lie: SgLie; dist: number },
  after: { lie: SgLie; dist: number } | 'holed',
  penalties = 0,
): number {
  const b = baseline(before.lie, before.dist)
  const a = after === 'holed' ? 0 : baseline(after.lie, after.dist)
  return Math.round((b - a - 1 - penalties) * 100) / 100
}

export type SgCategory = 'OTT' | 'APP' | 'ARG' | 'PUTT'

export interface RoundSg {
  total: number
  ott: number
  app: number
  arg: number
  putt: number
  shotsMeasured: number
  perShot: { shot: LoggedShot; category: SgCategory; sg: number }[]
}

export function categorize(shot: LoggedShot, holePar: number): SgCategory {
  if (shot.shotNumber === 1 && holePar >= 4) return 'OTT'
  const d = shot.sgBefore?.dist ?? shot.intendedDistance
  if (shot.sgBefore?.lie === 'green') return 'PUTT'
  return d <= 50 ? 'ARG' : 'APP'
}

/**
 * Round-level strokes gained. Uses precise GPS data when shots carry
 * sgBefore/sgAfter; falls back to intended-distance approximations for
 * manually logged shots. Putting is estimated from putt counts when no
 * green-read distances exist.
 */
export function roundStrokesGained(round: Round): RoundSg {
  const out: RoundSg = { total: 0, ott: 0, app: 0, arg: 0, putt: 0, shotsMeasured: 0, perShot: [] }
  for (const hole of round.holes) {
    if (!hole.strokes) continue
    for (let i = 0; i < hole.shots.length; i++) {
      const shot = hole.shots[i]
      const before = shot.sgBefore ?? {
        lie: i === 0 && hole.par >= 4 ? ('tee' as SgLie) : mapLie(shot.lie),
        dist: shot.intendedDistance,
      }
      const next = hole.shots[i + 1]
      const isLastTracked = i === hole.shots.length - 1
      let after: { lie: SgLie; dist: number } | 'holed'
      if (shot.outcome === 'holed') after = 'holed'
      else if (shot.sgAfter) after = shot.sgAfter
      else if (next?.sgBefore) after = next.sgBefore
      else if (next) after = { lie: mapLie(next.lie), dist: next.intendedDistance }
      else if (isLastTracked && hole.putts > 0) {
        // remaining strokes are putts: assume first putt distance from baseline inverse
        after = { lie: 'green', dist: hole.putts >= 3 ? 38 : hole.putts === 2 ? 20 : 6 }
      } else after = { lie: 'fairway', dist: 30 }

      const penalty = ['water', 'ob'].includes(shot.outcome) ? 1 : 0
      const sg = strokesGainedShot(before, after, penalty)
      const cat = categorize(shot, hole.par)
      out.perShot.push({ shot, category: cat, sg })
      out.shotsMeasured++
      if (cat === 'OTT') out.ott += sg
      else if (cat === 'APP') out.app += sg
      else if (cat === 'ARG') out.arg += sg
    }
    // Putting from putt counts: SG = baseline(first-putt distance) − putts
    if (hole.putts > 0) {
      const firstPuttFt = hole.putts >= 3 ? 38 : hole.putts === 2 ? 20 : 6
      out.putt += baseline('green', firstPuttFt) - hole.putts
    }
  }
  out.ott = r2(out.ott)
  out.app = r2(out.app)
  out.arg = r2(out.arg)
  out.putt = r2(out.putt)
  out.total = r2(out.ott + out.app + out.arg + out.putt)
  return out
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function sgLabel(cat: SgCategory): string {
  return { OTT: 'Off the tee', APP: 'Approach', ARG: 'Around green', PUTT: 'Putting' }[cat]
}

/** Where is the player losing the most? Returns sorted worst-first. */
export function sgPriorities(rounds: Round[]): { cat: SgCategory; avg: number }[] {
  const done = rounds.filter((r) => r.status === 'complete')
  if (!done.length) return []
  const sums: Record<SgCategory, number> = { OTT: 0, APP: 0, ARG: 0, PUTT: 0 }
  for (const r of done) {
    const sg = roundStrokesGained(r)
    sums.OTT += sg.ott
    sums.APP += sg.app
    sums.ARG += sg.arg
    sums.PUTT += sg.putt
  }
  return (Object.keys(sums) as SgCategory[])
    .map((cat) => ({ cat, avg: r2(sums[cat] / done.length) }))
    .sort((a, b) => a.avg - b.avg)
}
