// Logic smoke test: exercises every engine the UI depends on.
// Run: node scripts/run-smoke.mjs
import { buildSeedState } from '../src/data/seed'
import { COURSES, getHole } from '../src/data/courses'
import { DRILLS } from '../src/data/drills'
import { teeAdvice, approachAdvice } from '../src/lib/caddieEngine'
import { normalizeShot, recommendClub, detectMissPattern, estimateClubConfidence, calculateAdjustedDistance } from '../src/lib/shotNormalization'
import { generateShotFeedback, generateRangeShotFeedback, generateRangeSummary, generateRoundRecap, generatePracticePlan, generateTodaysFocus, generateHomeSummary, explainNormalization } from '../src/lib/aiCoach'
import { recommendDrills } from '../src/lib/drillEngine'
import { computeClubStats, computeWeaknesses, strokesLostByCategory, scoreTrend, trueSkillIndex, bestAndWorstClub, gappingWarnings, allShots, rangeTrend } from '../src/lib/insights'

let failures = 0
function check(name: string, fn: () => unknown) {
  try {
    const v = fn()
    console.log(`✓ ${name}`, typeof v === 'string' ? `→ ${v.slice(0, 90)}` : '')
  } catch (e) {
    failures++
    console.error(`✗ ${name}:`, e)
  }
}

const state = buildSeedState()
state.onboarded = true

check('seed: 3 rounds, 2 range sessions', () => {
  if (state.rounds.length !== 3) throw new Error(`rounds=${state.rounds.length}`)
  if (state.rangeSessions.length !== 2) throw new Error(`sessions=${state.rangeSessions.length}`)
  if (state.bag.length !== 14) throw new Error(`bag=${state.bag.length}`)
  return `rounds ok, ${allShots(state.rounds).length} shots seeded`
})

check('normalizeShot: downhill+tailwind+firm driver', () => {
  const n = normalizeShot({
    clubId: 'DR', intendedDistance: 260, actualDistance: 300, line: 'center',
    contact: 'pure', shape: 'straight', lie: 'tee', outcome: 'fairway',
    conditions: { windSpeed: 15, windDir: 'down', elevationFt: -30, tempF: 85, firmness: 'firm', wet: false, slope: 'flat' },
  })
  if (n.normalizedTotal >= 300) throw new Error('should normalize DOWN, got ' + n.normalizedTotal)
  if (n.adjustments.length < 3) throw new Error('expected multiple adjustments')
  return `300 raw → ${n.normalizedCarry} carry / ${n.normalizedTotal} total (${n.adjustments.length} factors)`
})

check('normalizeShot: into-wind rough 7i normalizes UP', () => {
  const n = normalizeShot({
    clubId: '7I', intendedDistance: 155, actualDistance: 132, line: 'center',
    contact: 'pure', shape: 'straight', lie: 'rough', outcome: 'short',
    conditions: { windSpeed: 12, windDir: 'into', elevationFt: 10, tempF: 50, firmness: 'normal', wet: true, slope: 'flat' },
  })
  if (n.normalizedTotal <= 132) throw new Error('should normalize UP, got ' + n.normalizedTotal)
  return `132 raw → ${n.normalizedTotal} neutral`
})

check('calculateAdjustedDistance plays-like', () => {
  const r = calculateAdjustedDistance(150, { windSpeed: 12, windDir: 'into', elevationFt: 15, tempF: 72, firmness: 'normal', wet: false, slope: 'flat' }, 'fairway')
  if (r.playsLike <= 150) throw new Error('into wind uphill must play longer: ' + r.playsLike)
  return `150 plays like ${r.playsLike}`
})

check('recommendClub picks a real club', () => {
  const r = recommendClub(155, { windSpeed: 10, windDir: 'into', elevationFt: 0, tempF: 72, firmness: 'normal', wet: false, slope: 'flat' }, 'fairway', state.bag)
  return `${r.clubId} for 155 into wind (plays ${r.playsLike})`
})

for (const course of COURSES) {
  for (const hole of course.holes) {
    check(`teeAdvice ${course.id} #${hole.number}`, () => {
      const a = teeAdvice(hole, state.profile, state.bag, { windSpeed: 12, windDir: 'into', elevationFt: 0, tempF: 72, firmness: 'normal', wet: false, slope: 'flat' })
      if (!a.club || a.rationale.length === 0) throw new Error('empty advice')
      return `${a.club} → ${a.target} (risk ${a.riskLevel})`
    })
  }
}

check('approachAdvice from rough', () => {
  const a = approachAdvice(155, getHole('flintridge', 1), state.profile, state.bag, { windSpeed: 8, windDir: 'cross-right', elevationFt: -8, tempF: 72, firmness: 'normal', wet: false, slope: 'downhill' }, 'rough')
  return `${a.club} → ${a.target}`
})

check('generateShotFeedback variants', () => {
  const contacts = ['pure', 'thin', 'fat', 'heel'] as const
  const outcomes = ['fairway', 'water', 'green', 'rough'] as const
  for (let i = 0; i < 4; i++) {
    const fb = generateShotFeedback({
      clubId: 'DR', intendedDistance: 250, actualDistance: 230, line: 'right', contact: contacts[i],
      shape: 'slice', lie: 'tee', outcome: outcomes[i],
      conditions: { windSpeed: 12, windDir: 'into', elevationFt: 0, tempF: 72, firmness: 'normal', wet: false, slope: 'flat' },
    }, state.profile)
    if (!fb || fb.length < 10) throw new Error('weak feedback')
  }
  return 'all variants generated'
})

check('range feedback + summary', () => {
  const session = state.rangeSessions[1]
  const fb = generateRangeShotFeedback({ clubId: 'DR', depth: 'short', line: 'right', tags: ['slice'], n: 7 }, session.shots, 'fix-slice')
  const sum = generateRangeSummary(session.shots, 'fix-slice')
  if (!fb || !sum.summary || sum.score <= 0) throw new Error('bad summary')
  return `score ${sum.score}: ${sum.summary.slice(0, 70)}`
})

check('round recap', () => generateRoundRecap(state.rounds[0], state.profile))
check('miss pattern', () => JSON.stringify(detectMissPattern(allShots(state.rounds))))
check('club confidence', () => String(estimateClubConfidence(allShots(state.rounds).filter((s) => s.clubId === 'DR'), 258)))
check('drills: 12 with full protocol', () => {
  if (DRILLS.length < 12) throw new Error(`only ${DRILLS.length}`)
  for (const d of DRILLS) {
    for (const k of ['objective', 'setup', 'reps', 'scoring', 'track', 'success', 'cue', 'progression'] as const) {
      if (!d[k]) throw new Error(`${d.id} missing ${k}`)
    }
  }
  return `${DRILLS.length} drills validated`
})
check('drill recommendations', () => recommendDrills('fix-slice', state.profile)[0].id)
check('club stats', () => {
  const s = computeClubStats(state)
  if (s.length < 10) throw new Error('too few clubs')
  return `${s.length} clubs, DR conf ${s.find((x) => x.clubId === 'DR')?.confidence}%`
})
check('weaknesses', () => computeWeaknesses(state).map((w) => w.title).join(' | '))
check('strokes lost', () => strokesLostByCategory(state).map((c) => `${c.category}:${c.strokes}`).join(' '))
check('score trend', () => JSON.stringify(scoreTrend(state.rounds).map((t) => t.score)))
check('range trend', () => JSON.stringify(rangeTrend(state.rangeSessions).map((t) => t.score)))
check('true skill index', () => {
  const tsi = trueSkillIndex(state)
  if (tsi < 1 || tsi > 100) throw new Error('TSI out of range: ' + tsi)
  return String(tsi)
})
check('best/worst club', () => {
  const { best, worst } = bestAndWorstClub(computeClubStats(state))
  return `${best.clubId} / ${worst.clubId}`
})
check('gapping warnings', () => gappingWarnings(computeClubStats(state)).join(' | ') || 'none')
check('practice plan', () => generatePracticePlan(state.profile, ['Driver penalties', '80–125 yd wedge gap']).map((p) => p.drillId).join(', '))
check('today focus + home summary', () => generateTodaysFocus(state.profile, ['Driver penalties']) + ' // ' + generateHomeSummary(state.profile, ['Driver penalties', 'Wedges'], '8 Iron'))
check('explain normalization', () => explainNormalization(allShots(state.rounds)[0]).join(' '))

console.log(failures === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
