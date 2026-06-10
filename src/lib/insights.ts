import type { AppState, ClubId, ClubStats, LoggedShot, RangeSession, Round } from '../types'
import { getClub, orderedBag } from '../data/clubs'
import { detectMissPattern, estimateClubConfidence } from './shotNormalization'
import { avg, pct, round1 } from './utils'

/** Analytics derived from logged rounds + range sessions. */

export function allShots(rounds: Round[]): LoggedShot[] {
  return rounds.flatMap((r) => r.holes.flatMap((h) => h.shots))
}

export function computeClubStats(state: AppState): ClubStats[] {
  const shots = allShots(state.rounds)
  return orderedBag(state.bag)
    .filter((b) => b.clubId !== 'PT')
    .map((b) => {
      const clubShots = shots.filter((s) => s.clubId === b.clubId)
      const rawAvg = Math.round(avg(clubShots.map((s) => s.actualDistance))) || b.total
      const normAvg = Math.round(avg(clubShots.map((s) => s.normalized.normalizedTotal))) || b.total
      const pattern = detectMissPattern(clubShots)
      const lateralSpread = dispersionEstimate(clubShots, b.total)
      return {
        clubId: b.clubId,
        shots: clubShots.length,
        rawAvg,
        normalizedAvg: normAvg,
        carry: Math.round(avg(clubShots.map((s) => s.normalized.normalizedCarry))) || b.carry,
        total: normAvg,
        confidence: estimateClubConfidence(clubShots, b.total),
        dispersion: lateralSpread,
        commonMiss: pattern.confidence > 30 ? pattern.label : 'No clear pattern',
        recommendation: useCase(b.clubId, pattern.label),
      }
    })
}

function dispersionEstimate(shots: LoggedShot[], stockTotal: number): number {
  if (shots.length < 2) return Math.round(stockTotal * 0.07)
  const offline = shots.map((s) => (s.line === 'center' ? stockTotal * 0.025 : stockTotal * 0.085))
  return Math.round(avg(offline))
}

function useCase(clubId: ClubId, missLabel: string): string {
  const club = getClub(clubId)
  if (club.type === 'driver') return missLabel.includes('right') ? 'Open holes & trouble-left holes. Avoid water-right tee shots.' : 'Wide fairways and reachable par 5s.'
  if (club.type === 'wood' || club.type === 'hybrid') return 'Position club on tight tee shots; long par-3s.'
  if (club.type === 'wedge') return 'Scoring zone — attack pins inside its stock number.'
  return missLabel.includes('short') ? 'Approach club — take one more when between numbers.' : 'Stock approach club.'
}

// ── Weaknesses (the "top 3 leaks") ─────────────────────────────────────

export interface Weakness {
  title: string
  detail: string
  severity: number // strokes/round estimate
}

export function computeWeaknesses(state: AppState): Weakness[] {
  const shots = allShots(state.rounds)
  const completed = state.rounds.filter((r) => r.status === 'complete')
  const nRounds = Math.max(completed.length, 1)
  const list: Weakness[] = []

  // Penalties off the tee
  const penalties = completed.reduce((a, r) => a + r.holes.reduce((x, h) => x + h.penalties, 0), 0)
  const driverPenalties = shots.filter((s) => s.clubId === 'DR' && ['water', 'ob'].includes(s.outcome)).length
  if (penalties > 0) {
    list.push({
      title: 'Driver penalties',
      detail: `Your driver is long enough but costs ~${round1((penalties * 1.4) / nRounds)} strokes/round from penalties (${driverPenalties} tee balls in hazards logged).`,
      severity: round1((penalties * 1.4) / nRounds),
    })
  }

  // Wedge band proximity
  const wedgeShots = shots.filter((s) => s.intendedDistance >= 80 && s.intendedDistance <= 125)
  const wedgeMissRate = wedgeShots.length ? wedgeShots.filter((s) => !['green', 'holed', 'fringe'].includes(s.outcome)).length / wedgeShots.length : 0.45
  if (wedgeMissRate > 0.35) {
    list.push({
      title: '80–125 yd wedge gap',
      detail: `You miss the green on ${pct(wedgeMissRate * 100, 100)}% of shots from the 80–125 band — your biggest scoring leak. Wedge matrix drill targets this directly.`,
      severity: round1(wedgeMissRate * 4),
    })
  }

  // Contact-driven iron misses
  const ironShots = shots.filter((s) => getClub(s.clubId).type === 'iron')
  const mishitRate = ironShots.length ? ironShots.filter((s) => s.contact !== 'pure').length / ironShots.length : 0.4
  if (mishitRate > 0.3) {
    list.push({
      title: 'Iron strike quality',
      detail: `${pct(mishitRate * 100, 100)}% of iron shots had imperfect contact. Low-point control is worth more than swing changes right now.`,
      severity: round1(mishitRate * 3.2),
    })
  }

  // Putting
  const putts = completed.flatMap((r) => r.holes.map((h) => h.putts))
  const avgPutts = avg(putts)
  if (avgPutts > 1.95) {
    list.push({
      title: 'Lag putting',
      detail: `Averaging ${round1(avgPutts)} putts/hole. Most three-putts start with a poor first-putt distance, not a missed 4-footer.`,
      severity: round1((avgPutts - 1.8) * 18 * 0.5),
    })
  }

  if (list.length === 0) {
    list.push({ title: 'Consistency under pressure', detail: 'No dominant leak detected — pressure practice protects your gains.', severity: 1 })
  }
  return list.sort((a, b) => b.severity - a.severity).slice(0, 3)
}

// ── Strokes lost by category ────────────────────────────────────────────

export interface CategoryLoss {
  category: string
  strokes: number
}

export function strokesLostByCategory(state: AppState): CategoryLoss[] {
  const completed = state.rounds.filter((r) => r.status === 'complete')
  const nRounds = Math.max(completed.length, 1)
  const shots = allShots(state.rounds)
  const penalties = completed.reduce((a, r) => a + r.holes.reduce((x, h) => x + h.penalties, 0), 0)
  const putts = completed.flatMap((r) => r.holes.map((h) => h.putts))
  const wedgeShots = shots.filter((s) => s.intendedDistance >= 80 && s.intendedDistance <= 125)
  const wedgeMisses = wedgeShots.filter((s) => !['green', 'holed', 'fringe'].includes(s.outcome)).length

  return [
    { category: 'Tee penalties', strokes: round1((penalties * 1.4) / nRounds) },
    { category: 'Approach (wedges)', strokes: round1((wedgeMisses * 0.7) / nRounds) || 2.1 },
    { category: 'Approach (irons)', strokes: round1(shots.filter((s) => getClub(s.clubId).type === 'iron' && s.contact !== 'pure').length * 0.25 / nRounds) || 1.6 },
    { category: 'Short game', strokes: 1.2 },
    { category: 'Putting', strokes: round1(Math.max(avg(putts) - 1.8, 0) * 18 * 0.45) || 0.8 },
  ].sort((a, b) => b.strokes - a.strokes)
}

// ── Trends & history ────────────────────────────────────────────────────

export function scoreTrend(rounds: Round[]): { date: string; score: number; toPar: number }[] {
  return rounds
    .filter((r) => r.status === 'complete')
    .map((r) => {
      const played = r.holes.filter((h) => h.strokes > 0)
      const score = played.reduce((a, h) => a + h.strokes, 0)
      const par = played.reduce((a, h) => a + h.par, 0)
      // Scale partial rounds (9 holes) to an 18-hole equivalent for the trend.
      const scale = played.length > 0 ? 18 / played.length : 1
      return { date: r.date, score: Math.round(score * scale), toPar: Math.round((score - par) * scale) }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function trueSkillIndex(state: AppState): number {
  const stats = computeClubStats(state)
  const conf = avg(stats.map((s) => s.confidence))
  const hcpComponent = Math.max(0, 100 - state.profile.handicap * 3.2)
  const weaknesses = computeWeaknesses(state)
  const leakPenalty = Math.min(weaknesses.reduce((a, w) => a + w.severity, 0) * 1.5, 20)
  return Math.round(conf * 0.45 + hcpComponent * 0.55 - leakPenalty + 12)
}

export function bestAndWorstClub(stats: ClubStats[]): { best: ClubStats; worst: ClubStats } {
  const withShots = stats.filter((s) => s.shots > 0)
  const pool = withShots.length >= 2 ? withShots : stats
  const sorted = [...pool].sort((a, b) => b.confidence - a.confidence)
  return { best: sorted[0], worst: sorted[sorted.length - 1] }
}

/** Detect clubs whose normalized totals overlap too tightly (gapping warning). */
export function gappingWarnings(stats: ClubStats[]): string[] {
  const sorted = [...stats].sort((a, b) => b.normalizedAvg - a.normalizedAvg)
  const warnings: string[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    const gap = a.normalizedAvg - b.normalizedAvg
    if (gap <= 5 && getClub(a.clubId).type !== 'wedge') {
      warnings.push(
        `Your ${getClub(a.clubId).label} and ${getClub(b.clubId).label} overlap (${a.normalizedAvg} vs ${b.normalizedAvg} normalized). Consider a hybrid/utility replacement.`,
      )
    }
  }
  return warnings.slice(0, 2)
}

export function rangeTrend(sessions: RangeSession[]): { date: string; score: number }[] {
  return sessions
    .filter((s) => s.status === 'complete')
    .map((s) => ({ date: s.date, score: s.score }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
