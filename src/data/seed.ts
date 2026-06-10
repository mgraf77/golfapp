import type {
  AppState, Conditions, Contact, FeedbackTag, HoleResult, Line, LoggedShot, Outcome,
  PlayerProfile, RangeSession, RangeShot, Round, ShotInput, ShotShape,
} from '../types'
import { defaultBag, getClub } from './clubs'
import { COURSES } from './courses'
import { generateRangeSummary, generateRoundRecap, generateShotFeedback } from '../lib/aiCoach'
import { normalizeShot } from '../lib/shotNormalization'
import { daysAgo, uid } from '../lib/utils'

/**
 * Seed data: a believable 15-handicap with a slice-biased driver, decent
 * 8-iron, and a leaky wedge game — so every insight in the app has teeth
 * from the first launch.
 */

// Small deterministic RNG so the seed is stable across resets.
let s = 42
function rnd(): number {
  s = (s * 16807) % 2147483647
  return (s - 1) / 2147483646
}
function rpick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]
}
function rint(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min
}

const SEED_PROFILE: PlayerProfile = {
  name: 'Alex Morgan',
  handicap: 15.2,
  typicalScore: 88,
  hand: 'right',
  homeCourseId: 'flintridge',
  goals: ['lower-scores', 'fix-slice', 'improve-irons'],
  commonMiss: 'slice',
  preferredShape: 'fade',
  practiceFrequency: '2-3x-week',
}

function neutralConditions(over?: Partial<Conditions>): Conditions {
  return {
    windSpeed: 0, windDir: 'calm', elevationFt: 0, tempF: 72,
    firmness: 'normal', wet: false, slope: 'flat', ...over,
  }
}

function makeShot(
  partial: Partial<ShotInput> & Pick<ShotInput, 'clubId' | 'intendedDistance' | 'actualDistance'>,
  holeNumber: number,
  shotNumber: number,
): LoggedShot {
  const input: ShotInput = {
    line: 'center',
    contact: 'pure',
    shape: 'straight',
    lie: shotNumber === 1 ? 'tee' : 'fairway',
    conditions: neutralConditions(),
    outcome: 'fairway',
    ...partial,
  }
  return {
    ...input,
    id: uid('shot_'),
    ts: Date.now(),
    holeNumber,
    shotNumber,
    normalized: normalizeShot(input),
    feedback: generateShotFeedback(input, SEED_PROFILE),
  }
}

/** Generate a believable hole result given par/yards and the player's tendencies. */
function playHole(holeNumber: number, par: number, yards: number, windy: boolean): HoleResult {
  const shots: LoggedShot[] = []
  const cond = windy
    ? neutralConditions({ windSpeed: rint(8, 14), windDir: rpick(['into', 'cross-right', 'down']) })
    : neutralConditions({ windSpeed: rint(0, 6), windDir: rpick(['calm', 'cross-left']) })

  let penalties = 0
  let fairway: HoleResult['fairway'] = 'na'
  let shotN = 1
  let remaining = yards

  if (par >= 4) {
    // Tee shot — slice bias: ~35% right miss, occasional penalty
    const r = rnd()
    const slice = r < 0.3
    const block = r >= 0.3 && r < 0.45
    const teeClub = rnd() < 0.75 ? 'DR' : '3W'
    const stock = getClub(teeClub as 'DR' | '3W').defaultTotal
    const dist = Math.round(stock * (slice ? 0.86 : 0.97) + rnd() * 18 - 9)
    const penalty = slice && rnd() < 0.45
    const outcome: Outcome = penalty ? (rnd() < 0.6 ? 'water' : 'ob') : slice || block ? 'rough' : 'fairway'
    fairway = outcome === 'fairway' ? 'hit' : slice || block ? 'right' : 'left'
    if (penalty) penalties += 1
    shots.push(
      makeShot(
        {
          clubId: teeClub as 'DR' | '3W',
          intendedDistance: stock,
          actualDistance: dist,
          line: slice || block ? 'right' : rnd() < 0.2 ? 'left' : 'center',
          contact: slice ? (rnd() < 0.5 ? 'heel' : 'pure') : rnd() < 0.75 ? 'pure' : rpick<Contact>(['toe', 'thin']),
          shape: slice ? 'slice' : block ? 'push' : rpick<ShotShape>(['straight', 'fade', 'draw']),
          lie: 'tee',
          conditions: cond,
          outcome,
        },
        holeNumber,
        shotN++,
      ),
    )
    remaining = Math.max(60, yards - dist + (penalty ? 30 : 0))
  }

  // Approach shot
  const appClub = remaining > 190 ? '4H' : remaining > 170 ? '5I' : remaining > 158 ? '6I' : remaining > 148 ? '7I' : remaining > 136 ? '8I' : remaining > 124 ? '9I' : remaining > 110 ? 'PW' : remaining > 95 ? 'GW' : 'SW'
  const isWedgeBand = remaining >= 80 && remaining <= 125
  const missGreen = rnd() < (isWedgeBand ? 0.62 : 0.55) // wedge leak baked in
  const contact: Contact = rnd() < 0.6 ? 'pure' : rpick<Contact>(['thin', 'fat', 'toe', 'heel'])
  const appOutcome: Outcome = !missGreen ? 'green' : rpick<Outcome>(['short', 'rough', 'bunker', 'fringe', 'long'])
  shots.push(
    makeShot(
      {
        clubId: appClub,
        intendedDistance: remaining,
        actualDistance: Math.round(remaining * (contact === 'pure' ? 1 : 0.88) + rnd() * 14 - 7),
        line: rnd() < 0.4 ? 'right' : rnd() < 0.55 ? 'center' : 'left',
        contact,
        shape: rnd() < 0.3 ? 'fade' : rpick<ShotShape>(['straight', 'push', 'pull', 'draw']),
        lie: par >= 4 ? (fairway === 'hit' ? 'fairway' : 'rough') : 'tee',
        conditions: cond,
        outcome: appOutcome,
      },
      holeNumber,
      shotN++,
    ),
  )

  const gir = appOutcome === 'green' && penalties === 0
  const putts = gir ? rint(1, 3) : rint(1, 2)
  const chips = gir ? 0 : rint(1, 2)
  const strokes = (par >= 4 ? 1 : 0) + 1 + chips + putts + penalties + (par === 5 ? 1 : 0)

  return { holeNumber, par, strokes, putts, fairway: par === 3 ? 'na' : fairway, gir, penalties, shots }
}

function makeRound(courseIdx: number, daysBack: number, windy: boolean): Round {
  const course = COURSES[courseIdx]
  const holes = course.holes.map((h) => playHole(h.number, h.par, h.yards, windy))
  const round: Round = {
    id: uid('round_'),
    courseId: course.id,
    date: daysAgo(daysBack),
    status: 'complete',
    currentHole: course.holes.length,
    conditions: neutralConditions(windy ? { windSpeed: 12, windDir: 'into' } : {}),
    holes,
  }
  round.recap = generateRoundRecap(round, SEED_PROFILE)
  return round
}

// ── Range sessions ──────────────────────────────────────────────────────

function makeRangeShot(n: number, clubId: RangeShot['clubId'], depth: RangeShot['depth'], line: Line, tags: FeedbackTag[], carry: number): RangeShot {
  return { id: uid('rs_'), n, clubId, depth, line, tags, carry, feedback: '' }
}

function sliceSession(daysBack: number): RangeSession {
  const shots: RangeShot[] = []
  // Slice rate improves over the session: 70% → 30%
  const script: Array<[RangeShot['depth'], Line, FeedbackTag[]]> = [
    ['short', 'right', ['slice', 'heel']],
    ['short', 'right', ['slice']],
    ['on', 'right', ['push']],
    ['short', 'right', ['slice', 'bad-tempo']],
    ['on', 'center', ['good']],
    ['short', 'right', ['slice']],
    ['on', 'right', ['push', 'toe']],
    ['on', 'center', ['good', 'straight']],
    ['short', 'right', ['slice']],
    ['on', 'center', ['great', 'center']],
    ['on', 'left', ['pull']],
    ['on', 'center', ['good']],
    ['long', 'center', ['great', 'center']],
    ['on', 'right', ['slice']],
    ['on', 'center', ['good', 'straight']],
    ['on', 'center', ['great']],
  ]
  script.forEach(([depth, line, tags], i) => {
    shots.push(makeRangeShot(i + 1, 'DR', depth, line, tags, 218 + rint(-12, 18)))
  })
  const { summary, score } = generateRangeSummary(shots, 'fix-slice')
  return {
    id: uid('range_'), date: daysAgo(daysBack), goal: 'fix-slice', clubIds: ['DR'],
    drillId: 'anti-slice-gate', status: 'complete', shots, score, summary,
  }
}

function wedgeSession(daysBack: number): RangeSession {
  const shots: RangeShot[] = []
  const clubs: RangeShot['clubId'][] = ['PW', 'GW', 'SW']
  for (let i = 0; i < 18; i++) {
    const clubId = clubs[Math.floor(i / 6)]
    const good = rnd() < 0.55
    const depth = good ? 'on' : rnd() < 0.65 ? 'short' : 'long'
    const line: Line = good ? 'center' : rpick<Line>(['left', 'right', 'center'])
    const tags: FeedbackTag[] = good ? (rnd() < 0.4 ? ['great'] : ['good']) : rnd() < 0.4 ? ['fat'] : rnd() < 0.5 ? ['thin'] : ['too-soft', 'short']
    shots.push(makeRangeShot(i + 1, clubId, depth, line, tags, getClub(clubId).defaultCarry + rint(-9, 7)))
  }
  const { summary, score } = generateRangeSummary(shots, 'dial-wedges')
  return {
    id: uid('range_'), date: daysAgo(daysBack), goal: 'dial-wedges', clubIds: clubs,
    drillId: 'wedge-matrix', status: 'complete', shots, score, summary,
  }
}

// ── Public API ──────────────────────────────────────────────────────────

export function buildSeedState(profile?: Partial<PlayerProfile>): AppState {
  s = 42 // reset RNG for deterministic data
  return {
    version: 1,
    onboarded: false,
    profile: { ...SEED_PROFILE, ...profile },
    bag: defaultBag(),
    rounds: [makeRound(0, 21, false), makeRound(1, 12, true), makeRound(0, 4, false)],
    rangeSessions: [sliceSession(9), wedgeSession(2)],
    activeRoundId: null,
    activeRangeId: null,
  }
}
