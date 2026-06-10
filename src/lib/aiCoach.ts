import type {
  FeedbackTag, LoggedShot, PlayerProfile, RangeGoal, RangeShot, Round, ShotInput,
} from '../types'
import { getClub } from '../data/clubs'
import { getCourse } from '../data/courses'
import { CONTACT_FACTORS, SHAPE_INFO } from './physicsEngine'
import { detectMissPattern, normalizeShot } from './shotNormalization'
import { pct, pickSeeded } from './utils'

/**
 * Local AI coach. No external API — rules + scoring + varied templates.
 * Everything the "AI" says is derived from real state, so the language can
 * stay confident without ever being unexplainable.
 */

let phraseSeed = 7
function vary(): number {
  phraseSeed = (phraseSeed * 31 + 17) % 10007
  return phraseSeed
}

// ── On-course shot feedback ─────────────────────────────────────────────

export function generateShotFeedback(input: ShotInput, profile: PlayerProfile): string {
  const norm = normalizeShot(input)
  const club = getClub(input.clubId)
  const parts: string[] = []
  const miss = input.actualDistance - input.intendedDistance

  // 1. Headline on strategy/strike
  if (['water', 'ob'].includes(input.outcome)) {
    parts.push(
      pickSeeded(
        [
          `Penalty — but log the cause, not the result: ${causeOf(input)}.`,
          `That one's wet. Root cause: ${causeOf(input)}.`,
          `Costly. The data says this was ${causeOf(input)}, not bad luck.`,
        ],
        vary(),
      ),
    )
  } else if (input.contact === 'pure' && ['fairway', 'green', 'holed'].includes(input.outcome)) {
    parts.push(
      pickSeeded(
        [
          'Correct strategy, committed swing. That is the blueprint.',
          'Flushed it and found the target — bank this feel.',
          'Exactly the shot the hole asked for.',
        ],
        vary(),
      ),
    )
  } else if (input.contact === 'pure') {
    parts.push('Good club choice, poor face control — strike was there, start line was not.')
  } else if (['fairway', 'green'].includes(input.outcome)) {
    parts.push(`Got away with ${input.contact} contact. The target choice protected the miss.`)
  } else {
    parts.push(`${CONTACT_FACTORS[input.contact].note}`)
  }

  // 2. Pattern link
  const side = SHAPE_INFO[input.shape].lateral
  if (side !== 'none' && shapeMatchesProfile(input, profile)) {
    parts.push(`This fits your ${side}-miss ${club.label.toLowerCase()} pattern.`)
  } else if (Math.abs(miss) > 12 && input.contact !== 'pure') {
    parts.push('Your miss was caused more by contact than aim.')
  }

  // 3. Normalization line
  if (norm.adjustments.length > 0) {
    const top = [...norm.adjustments].sort((a, b) => Math.abs(b.yards) - Math.abs(a.yards))[0]
    parts.push(top.note)
    if (Math.abs(norm.rawDistance - norm.normalizedTotal) >= 6) {
      parts.push(`Normalized: ${norm.normalizedTotal} yds (raw ${norm.rawDistance}).`)
    }
  }

  return parts.slice(0, 3).join(' ')
}

function causeOf(input: ShotInput): string {
  if (input.contact !== 'pure') return `a ${input.contact} strike`
  if (['slice', 'hook'].includes(input.shape)) return `the ${input.shape} pattern`
  if (['push', 'pull'].includes(input.shape)) return `a ${input.shape}ed start line`
  return 'an aggressive target for the lie'
}

function shapeMatchesProfile(input: ShotInput, profile: PlayerProfile): boolean {
  const rightMisses = ['slice', 'push', 'thin']
  const leftMisses = ['hook', 'pull']
  const side = SHAPE_INFO[input.shape].lateral
  if (side === 'right') return rightMisses.includes(profile.commonMiss)
  if (side === 'left') return leftMisses.includes(profile.commonMiss)
  return false
}

// ── Range shot feedback ─────────────────────────────────────────────────

const GOOD_TAGS: FeedbackTag[] = ['good', 'great', 'straight', 'center']
const CONTACT_TAGS: FeedbackTag[] = ['fat', 'thin', 'topped', 'bladed', 'duffed', 'shanked', 'bad-contact', 'toe', 'heel']
const CURVE_TAGS: FeedbackTag[] = ['slice', 'hook', 'push', 'pull']

export function generateRangeShotFeedback(
  shot: Pick<RangeShot, 'clubId' | 'depth' | 'line' | 'tags' | 'n'>,
  history: RangeShot[],
  goal: RangeGoal,
): string {
  const club = getClub(shot.clubId)
  const sameClub = history.filter((s) => s.clubId === shot.clubId)
  const n = sameClub.length + 1
  const isGood = shot.tags.some((t) => GOOD_TAGS.includes(t)) && shot.line === 'center' && shot.depth === 'on'

  // Pattern stats over this block
  const all = [...sameClub, shot as RangeShot]
  const shortRight = all.filter((s) => s.depth === 'short' && s.line === 'right').length
  const rightCount = all.filter((s) => s.line === 'right').length
  const sliceCount = all.filter((s) => s.tags.includes('slice')).length
  const contactIssues = all.filter((s) => s.tags.some((t) => CONTACT_TAGS.includes(t))).length

  if (isGood) {
    return pickSeeded(
      [
        `That's the rep. ${n > 3 ? `${pct(all.filter(goodShot).length, n)}% quality strikes this block — ` : ''}same tempo, same target, next ball.`,
        'Center contact, on line, on number. Recreate the rehearsal feel, not the result.',
        `Quality strike #${all.filter(goodShot).length} of ${n}. Don't speed up — boredom is the goal here.`,
      ],
      vary(),
    )
  }

  const lines: string[] = []
  if (n >= 4 && shortRight / n >= 0.5) {
    lines.push(
      `You're ${n} shots into this ${club.label.toLowerCase()} block. ${shortRight} of ${n} finished short-right — pattern confidence is rising.`,
    )
    lines.push('Next rep: slow the tempo, close the stance 2°, aim at the left-center target.')
  } else if (goal === 'fix-slice' && sliceCount >= 2 && sliceCount / n >= 0.4) {
    lines.push(`Slice rate ${pct(sliceCount, n)}% this block. The face is still open to the path.`)
    lines.push(
      pickSeeded(
        [
          'Cue: feel the toe of the club pass the heel through impact.',
          'Cue: swing out to 1 o\'clock — exaggerate until the ball draws.',
          'Drop to a 7-iron for 3 balls, find the draw, then bring it back to driver.',
        ],
        vary(),
      ),
    )
  } else if (contactIssues / n >= 0.5 && n >= 3) {
    lines.push(`${contactIssues} of ${n} reps had contact issues — fix the strike before chasing direction.`)
    lines.push('Cue: weight left, hands ahead, brush the turf in FRONT of the ball.')
  } else if (rightCount / n >= 0.6 && n >= 3) {
    lines.push(`${pct(rightCount, n)}% of this block leaked right. Check alignment first — feet, hips, face.`)
  } else {
    lines.push(missCue(shot))
  }
  return lines.join(' ')
}

function goodShot(s: Pick<RangeShot, 'tags' | 'line' | 'depth'>): boolean {
  return s.tags.some((t) => GOOD_TAGS.includes(t)) && s.line === 'center' && s.depth === 'on'
}

function missCue(shot: Pick<RangeShot, 'tags' | 'line' | 'depth'>): string {
  const t = shot.tags
  if (t.includes('shanked')) return 'Shank = hosel. Stand a touch farther away, feel the hands stay close to the body through impact.'
  if (t.includes('fat') || t.includes('duffed')) return 'Ground first. Move pressure to the lead side earlier — the low point must be past the ball.'
  if (t.includes('thin') || t.includes('bladed') || t.includes('topped')) return 'Caught it on the way up. Stay in your posture — chest down through the strike.'
  if (t.includes('slice')) return 'Open face. Strengthen the grip one knuckle and feel the face rotate through the ball.'
  if (t.includes('hook')) return 'Face slammed shut. Quiet the hands; let body rotation square the face.'
  if (t.includes('pull')) return 'Out-to-in with a square face. Drop the trail foot back an inch and swing out to right field.'
  if (t.includes('push')) return 'In-to-out with an open face. Check ball position — likely too far back.'
  if (t.includes('bad-tempo') || t.includes('too-hard')) return 'Tempo leak. Count "one-two" back, "three" through. Distance comes from sequence, not effort.'
  if (t.includes('bad-alignment')) return 'Lay a club down on your foot line. Most right misses start as alignment misses.'
  if (t.includes('too-soft') || t.includes('short')) return 'Committed swings only — deceleration is the most expensive miss in golf.'
  if (t.includes('long') || t.includes('wrong-club')) return 'Fine swing, wrong number. Recalibrate the stock carry before the next rep.'
  return 'Neutral rep. Pick a smaller target — specific targets shrink dispersion.'
}

// ── Session & round summaries ───────────────────────────────────────────

export function generateRangeSummary(shots: RangeShot[], goal: RangeGoal): { summary: string; score: number } {
  if (shots.length === 0) return { summary: 'No shots logged.', score: 0 }
  const n = shots.length
  const good = shots.filter(goodShot).length
  const firstHalf = shots.slice(0, Math.ceil(n / 2))
  const secondHalf = shots.slice(Math.ceil(n / 2))
  const sliceRate = (arr: RangeShot[]) => pct(arr.filter((s) => s.tags.includes('slice')).length, arr.length || 1)
  const contactRate = (arr: RangeShot[]) => pct(arr.filter((s) => s.tags.some((t) => CONTACT_TAGS.includes(t))).length, arr.length || 1)

  const score = Math.round(
    (good / n) * 70 + Math.min(n / 20, 1) * 15 + (contactRate(secondHalf) <= contactRate(firstHalf) ? 15 : 5),
  )

  const parts: string[] = []
  parts.push(`${n} shots, ${pct(good, n)}% quality reps.`)
  if (goal === 'fix-slice') {
    const s1 = sliceRate(firstHalf)
    const s2 = sliceRate(secondHalf)
    if (s1 > s2) parts.push(`Slice rate dropped from ${s1}% to ${s2}% over the session — the gate drill is working.`)
    else if (s2 > 0) parts.push(`Slice rate held at ~${s2}%. Next session: same drill, slower tempo, 7-iron resets between driver blocks.`)
    else parts.push('Zero slices logged. Time to add the pressure fairway challenge.')
  }
  const c1 = contactRate(firstHalf)
  const c2 = contactRate(secondHalf)
  if (c1 - c2 >= 15) parts.push(`Contact cleaned up as the session went on (${c1}% → ${c2}% mishit rate).`)
  else if (c2 - c1 >= 15) parts.push(`Contact degraded late (${c1}% → ${c2}%) — likely fatigue. End sessions on three good reps, not an empty bucket.`)

  const pattern = detectMissPattern(
    shots.map((s) => ({
      line: s.line,
      actualDistance: s.depth === 'on' ? 100 : s.depth === 'short' ? 88 : 112,
      intendedDistance: 100,
      contact: 'pure' as const,
    })),
  )
  if (pattern.confidence > 40) parts.push(`Dominant pattern this session: ${pattern.label.toLowerCase()} (${pattern.confidence}% confidence).`)

  return { summary: parts.join(' '), score }
}

export function generateRoundRecap(round: Round, profile: PlayerProfile): string {
  const course = getCourse(round.courseId)
  const played = round.holes.filter((h) => h.strokes > 0)
  if (played.length === 0) return 'No holes completed.'
  const strokes = played.reduce((a, h) => a + h.strokes, 0)
  const par = played.reduce((a, h) => a + h.par, 0)
  const penalties = played.reduce((a, h) => a + h.penalties, 0)
  const fairways = played.filter((h) => h.fairway === 'hit').length
  const fwAttempts = played.filter((h) => h.fairway !== 'na').length
  const girs = played.filter((h) => h.gir).length
  const putts = played.reduce((a, h) => a + h.putts, 0)

  const parts = [
    `${strokes} (${strokes - par >= 0 ? '+' : ''}${strokes - par}) over ${played.length} holes at ${course.name}: ${fairways}/${fwAttempts} fairways, ${girs} GIR, ${putts} putts.`,
  ]
  if (penalties >= 2) {
    parts.push(`${penalties} penalty strokes were the round's biggest leak — that's ${penalties} shots given away before skill even mattered.`)
  } else if (girs / played.length < 0.35) {
    parts.push('Approach play was the separator today. Greens in regulation, not putting, is where this round leaked.')
  } else if (putts / played.length > 2.1) {
    parts.push('Ball striking held up; the putter gave it back. Lag putting ladder before the next round.')
  } else {
    parts.push('A balanced round — keep the current plan and pressure-test the wedge matrix next.')
  }
  const allShots = played.flatMap((h) => h.shots)
  const pattern = detectMissPattern(allShots)
  if (pattern.confidence > 45) {
    parts.push(`Recurring miss: ${pattern.label.toLowerCase()}. The caddie will bias targets accordingly next round.`)
  }
  return parts.join(' ')
}

// ── Daily focus & practice plan ─────────────────────────────────────────

export function generateTodaysFocus(profile: PlayerProfile, weaknesses: string[]): string {
  const focus = weaknesses[0] ?? 'overall consistency'
  return pickSeeded(
    [
      `Today's focus: ${focus}. One thing, done deliberately, beats five things done casually.`,
      `Priority: ${focus}. Spend the first 15 minutes of any practice here before touching the driver.`,
      `The model says ${focus} is your highest-leverage fix right now.`,
    ],
    profile.handicap + new Date().getDate(),
  )
}

export function generateHomeSummary(profile: PlayerProfile, weaknesses: string[], bestClub: string): string {
  return `Your scoring ceiling is being held back less by distance and more by ${weaknesses[0]?.toLowerCase() ?? 'consistency'} and ${weaknesses[1]?.toLowerCase() ?? 'wedge proximity'}. ${bestClub} is your most bankable club — build game plans that create ${bestClub} numbers.`
}

export interface PracticePlanItem {
  drillId: string
  reason: string
  minutes: number
}

export function generatePracticePlan(profile: PlayerProfile, weaknesses: string[]): PracticePlanItem[] {
  const plan: PracticePlanItem[] = []
  const w = weaknesses.join(' ').toLowerCase()
  if (w.includes('driver') || w.includes('penal') || profile.commonMiss === 'slice') {
    plan.push({ drillId: 'anti-slice-gate', reason: 'Driver dispersion is your most expensive leak.', minutes: 25 })
  }
  if (w.includes('wedge') || w.includes('100')) {
    plan.push({ drillId: 'wedge-matrix', reason: 'The 80–125 band is your biggest scoring opportunity.', minutes: 35 })
  }
  if (w.includes('contact') || w.includes('iron')) {
    plan.push({ drillId: 'low-point-towel', reason: 'Strike quality is capping your iron consistency.', minutes: 20 })
  }
  if (w.includes('putt')) {
    plan.push({ drillId: 'lag-ladder', reason: 'Three-putt avoidance is free strokes.', minutes: 15 })
  }
  if (plan.length < 2) {
    plan.push({ drillId: 'carry-ladder-7i', reason: 'Stock yardages anchor every caddie recommendation.', minutes: 20 })
  }
  if (plan.length < 3) {
    plan.push({ drillId: 'pressure-fairway', reason: 'Transfer practice gains to the course under pressure.', minutes: 20 })
  }
  return plan.slice(0, 3)
}

// ── Normalization explainer for LoggedShot card ────────────────────────

export function explainNormalization(shot: LoggedShot): string[] {
  const lines = shot.normalized.adjustments.map((a) => `${a.yards > 0 ? '+' : ''}${Math.round(a.yards)} yds — ${a.note}`)
  lines.push(`Repeatable value: ${shot.normalized.normalizedCarry} carry / ${shot.normalized.normalizedTotal} total.`)
  return lines
}
