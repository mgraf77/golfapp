import type { HandicapDetail, ScoreEntry } from '../types/geo'

/**
 * World Handicap System (WHS) implementation:
 *  - score differential = 113/slope × (adjusted gross − course rating)
 *  - handicap index = average of best differentials per the WHS table,
 *    with the small-sample adjustments and soft/hard caps
 *  - course handicap = index × slope/113 + (rating − par)
 *  - net double bogey ceiling for adjusted gross scoring
 */

export function scoreDifferential(adjustedGross: number, rating: number, slope: number): number {
  return Math.round(((113 / slope) * (adjustedGross - rating)) * 10) / 10
}

/** WHS table: how many differentials count and what adjustment applies. */
function whsSelection(n: number): { use: number; adj: number } {
  if (n <= 3) return { use: 1, adj: -2 }
  if (n === 4) return { use: 1, adj: -1 }
  if (n === 5) return { use: 1, adj: 0 }
  if (n === 6) return { use: 2, adj: -1 }
  if (n <= 8) return { use: 2, adj: 0 }
  if (n <= 11) return { use: 3, adj: 0 }
  if (n <= 14) return { use: 4, adj: 0 }
  if (n <= 16) return { use: 5, adj: 0 }
  if (n <= 18) return { use: 6, adj: 0 }
  if (n === 19) return { use: 7, adj: 0 }
  return { use: 8, adj: 0 }
}

function rawIndex(diffs: number[]): number | null {
  if (diffs.length < 3) return null
  const recent = diffs.slice(-20)
  const { use, adj } = whsSelection(recent.length)
  const best = [...recent].sort((a, b) => a - b).slice(0, use)
  const avg = best.reduce((s, d) => s + d, 0) / best.length + adj
  return Math.min(54, Math.round(avg * 10) / 10)
}

/**
 * Full computation with history trend and soft/hard caps against the
 * player's low index over the score window.
 */
export function computeHandicap(scores: ScoreEntry[]): HandicapDetail {
  const sorted = [...scores].sort((a, b) => a.date.localeCompare(b.date))
  const diffs = sorted.map((s) => s.differential)

  // index history after each score (for trend + low index)
  const trend: number[] = []
  for (let i = 3; i <= diffs.length; i++) {
    const idx = rawIndex(diffs.slice(0, i))
    if (idx != null) trend.push(idx)
  }
  const lowIndex = trend.length ? Math.min(...trend) : null
  let index = rawIndex(diffs)
  let capApplied: HandicapDetail['capApplied'] = 'none'

  if (index != null && lowIndex != null && index > lowIndex + 3) {
    // soft cap: 50% of increase beyond 3.0; hard cap: max +5.0
    const soft = lowIndex + 3 + (index - lowIndex - 3) * 0.5
    capApplied = 'soft'
    if (soft > lowIndex + 5) {
      index = lowIndex + 5
      capApplied = 'hard'
    } else {
      index = Math.round(soft * 10) / 10
    }
  }

  // which differential drops out of the best-8 next (the score to beat)
  let nextOut: number | null = null
  if (diffs.length >= 20) {
    const recent = diffs.slice(-20)
    const best = [...recent].sort((a, b) => a - b).slice(0, 8)
    nextOut = best[best.length - 1]
  }

  const n = diffs.length
  const message =
    index == null
      ? `Post ${3 - n} more score${3 - n === 1 ? '' : 's'} to establish a Handicap Index.`
      : n < 20
        ? `Provisional index from ${n} scores — counts best ${whsSelection(Math.min(n, 20)).use}. Full WHS uses best 8 of 20.`
        : `Best 8 of your last 20 differentials.${nextOut != null ? ` Beat a ${nextOut.toFixed(1)} differential to move it.` : ''}`

  return {
    index,
    used: Math.min(whsSelection(Math.min(n, 20)).use, n),
    total: n,
    lowIndex,
    capApplied,
    trend,
    nextOut,
    message,
  }
}

export function courseHandicap(index: number, slope: number, rating: number, par: number): number {
  return Math.round(index * (slope / 113) + (rating - par))
}

/**
 * Net double bogey ceiling per hole: par + 2 + strokes received.
 * Returns the adjusted gross for a full round.
 */
export function adjustedGrossScore(
  holes: { par: number; strokes: number; handicap: number }[],
  courseHcp: number,
): number {
  let total = 0
  const holeCount = holes.length || 18
  for (const h of holes) {
    if (!h.strokes) continue
    const base = Math.floor(courseHcp / holeCount)
    const extra = h.handicap <= courseHcp % holeCount ? 1 : 0
    const received = courseHcp >= 0 ? base + extra : 0
    const ceiling = h.par + 2 + received
    total += Math.min(h.strokes, ceiling)
  }
  return total
}

export function fmtIndex(index: number | null): string {
  if (index == null) return '—'
  return index < 0 ? `+${Math.abs(index).toFixed(1)}` : index.toFixed(1)
}
