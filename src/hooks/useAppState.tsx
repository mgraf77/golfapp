import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type {
  AppState, BagClub, ClubId, Conditions, HoleResult, LoggedShot, PlayerProfile,
  RangeGoal, RangeSession, RangeShot, Round, ShotInput,
} from '../types'
import { buildSeedState } from '../data/seed'
import { getCourse } from '../data/courses'
import {
  generateRangeShotFeedback, generateRangeSummary, generateRoundRecap, generateShotFeedback,
} from '../lib/aiCoach'
import { normalizeShot } from '../lib/shotNormalization'
import { clearState, loadState, saveState } from '../lib/storage'
import { uid } from '../lib/utils'

type Action =
  | { type: 'COMPLETE_ONBOARDING'; profile: PlayerProfile; bag: BagClub[] }
  | { type: 'UPDATE_PROFILE'; profile: Partial<PlayerProfile> }
  | { type: 'UPDATE_BAG_CLUB'; clubId: ClubId; carry: number; total: number }
  | { type: 'START_ROUND'; courseId: string; conditions: Conditions }
  | { type: 'LOG_SHOT'; input: ShotInput }
  | { type: 'FINISH_HOLE'; putts: number }
  | { type: 'END_ROUND' }
  | { type: 'ABANDON_ROUND' }
  | { type: 'START_RANGE'; goal: RangeGoal; clubIds: ClubId[]; drillId: string }
  | { type: 'LOG_RANGE_SHOT'; shot: Omit<RangeShot, 'id' | 'n' | 'feedback'> }
  | { type: 'END_RANGE' }
  | { type: 'RESET_DEMO' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboarded: true, profile: action.profile, bag: action.bag }

    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.profile } }

    case 'UPDATE_BAG_CLUB':
      return {
        ...state,
        bag: state.bag.map((b) =>
          b.clubId === action.clubId ? { ...b, carry: action.carry, total: action.total } : b,
        ),
      }

    case 'START_ROUND': {
      const course = getCourse(action.courseId)
      const round: Round = {
        id: uid('round_'),
        courseId: action.courseId,
        date: new Date().toISOString(),
        status: 'active',
        currentHole: 1,
        conditions: action.conditions,
        holes: course.holes.map(
          (h): HoleResult => ({
            holeNumber: h.number, par: h.par, strokes: 0, putts: 0,
            fairway: 'na', gir: false, penalties: 0, shots: [],
          }),
        ),
      }
      return { ...state, rounds: [...state.rounds, round], activeRoundId: round.id }
    }

    case 'LOG_SHOT': {
      const round = state.rounds.find((r) => r.id === state.activeRoundId)
      if (!round) return state
      const hole = round.holes.find((h) => h.holeNumber === round.currentHole)
      if (!hole) return state
      const shot: LoggedShot = {
        ...action.input,
        id: uid('shot_'),
        ts: Date.now(),
        holeNumber: round.currentHole,
        shotNumber: hole.shots.length + 1,
        normalized: normalizeShot(action.input),
        feedback: generateShotFeedback(action.input, state.profile),
      }
      const penalty = ['water', 'ob'].includes(action.input.outcome) ? 1 : 0
      const updatedHole: HoleResult = {
        ...hole,
        shots: [...hole.shots, shot],
        penalties: hole.penalties + penalty,
        fairway:
          shot.shotNumber === 1 && hole.par >= 4
            ? action.input.outcome === 'fairway'
              ? 'hit'
              : action.input.line === 'left'
                ? 'left'
                : 'right'
            : hole.fairway,
        gir:
          hole.gir ||
          (['green', 'holed'].includes(action.input.outcome) &&
            hole.shots.length + 1 <= hole.par - 2),
      }
      return updateRound(state, round.id, (r) => ({
        ...r,
        holes: r.holes.map((h) => (h.holeNumber === r.currentHole ? updatedHole : h)),
      }))
    }

    case 'FINISH_HOLE': {
      const round = state.rounds.find((r) => r.id === state.activeRoundId)
      if (!round) return state
      const hole = round.holes.find((h) => h.holeNumber === round.currentHole)
      if (!hole) return state
      const strokes = hole.shots.length + hole.penalties + action.putts
      const isLast = round.currentHole >= round.holes.length
      const next = updateRound(state, round.id, (r) => ({
        ...r,
        currentHole: isLast ? r.currentHole : r.currentHole + 1,
        holes: r.holes.map((h) =>
          h.holeNumber === r.currentHole ? { ...h, putts: action.putts, strokes } : h,
        ),
      }))
      if (isLast) return finishRound(next, round.id)
      return next
    }

    case 'END_ROUND':
      return state.activeRoundId ? finishRound(state, state.activeRoundId) : state

    case 'ABANDON_ROUND':
      return {
        ...state,
        rounds: state.rounds.filter((r) => r.id !== state.activeRoundId),
        activeRoundId: null,
      }

    case 'START_RANGE': {
      const session: RangeSession = {
        id: uid('range_'),
        date: new Date().toISOString(),
        goal: action.goal,
        clubIds: action.clubIds,
        drillId: action.drillId,
        status: 'active',
        shots: [],
        score: 0,
      }
      return { ...state, rangeSessions: [...state.rangeSessions, session], activeRangeId: session.id }
    }

    case 'LOG_RANGE_SHOT': {
      const session = state.rangeSessions.find((s) => s.id === state.activeRangeId)
      if (!session) return state
      const shot: RangeShot = {
        ...action.shot,
        id: uid('rs_'),
        n: session.shots.length + 1,
        feedback: generateRangeShotFeedback(
          { ...action.shot, n: session.shots.length + 1 },
          session.shots,
          session.goal,
        ),
      }
      return {
        ...state,
        rangeSessions: state.rangeSessions.map((s) =>
          s.id === session.id ? { ...s, shots: [...s.shots, shot] } : s,
        ),
      }
    }

    case 'END_RANGE': {
      const session = state.rangeSessions.find((s) => s.id === state.activeRangeId)
      if (!session) return { ...state, activeRangeId: null }
      if (session.shots.length === 0) {
        return {
          ...state,
          rangeSessions: state.rangeSessions.filter((s) => s.id !== session.id),
          activeRangeId: null,
        }
      }
      const { summary, score } = generateRangeSummary(session.shots, session.goal)
      return {
        ...state,
        activeRangeId: null,
        rangeSessions: state.rangeSessions.map((s) =>
          s.id === session.id ? { ...s, status: 'complete', summary, score } : s,
        ),
      }
    }

    case 'RESET_DEMO':
      clearState()
      return buildSeedState()

    default:
      return state
  }
}

function updateRound(state: AppState, roundId: string, fn: (r: Round) => Round): AppState {
  return { ...state, rounds: state.rounds.map((r) => (r.id === roundId ? fn(r) : r)) }
}

function finishRound(state: AppState, roundId: string): AppState {
  const next = updateRound(state, roundId, (r) => {
    const complete: Round = { ...r, status: 'complete' }
    return { ...complete, recap: generateRoundRecap(complete, state.profile) }
  })
  return { ...next, activeRoundId: null }
}

// ── Context ─────────────────────────────────────────────────────────────

interface Ctx {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppStateContext = createContext<Ctx | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState() ?? buildSeedState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}

export function useActiveRound(): Round | null {
  const { state } = useAppState()
  return state.rounds.find((r) => r.id === state.activeRoundId) ?? null
}

export function useActiveRange(): RangeSession | null {
  const { state } = useAppState()
  return state.rangeSessions.find((s) => s.id === state.activeRangeId) ?? null
}
