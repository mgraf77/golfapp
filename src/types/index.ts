// ── Core golf domain types ──────────────────────────────────────────────

export type ClubId =
  | 'DR' | '3W' | '5W' | '3H' | '4H'
  | '4I' | '5I' | '6I' | '7I' | '8I' | '9I'
  | 'PW' | 'GW' | 'SW' | 'LW' | 'PT'

export type ClubType = 'driver' | 'wood' | 'hybrid' | 'iron' | 'wedge' | 'putter'

export interface Club {
  id: ClubId
  label: string
  short: string
  type: ClubType
  loft: number
  defaultCarry: number
  defaultTotal: number
}

export interface BagClub {
  clubId: ClubId
  carry: number
  total: number
}

// ── Shot taxonomy ───────────────────────────────────────────────────────

export type Contact = 'pure' | 'thin' | 'fat' | 'toe' | 'heel' | 'topped' | 'shank'
export type ShotShape = 'straight' | 'draw' | 'fade' | 'slice' | 'hook' | 'push' | 'pull'
export type Lie =
  | 'tee' | 'fairway' | 'rough' | 'deep-rough' | 'bunker' | 'fringe' | 'recovery'
export type SlopeLie = 'flat' | 'uphill' | 'downhill' | 'ball-above' | 'ball-below'
export type WindDir = 'calm' | 'into' | 'down' | 'cross-left' | 'cross-right'
export type Firmness = 'soft' | 'normal' | 'firm'
export type Outcome =
  | 'fairway' | 'rough' | 'bunker' | 'water' | 'ob'
  | 'green' | 'fringe' | 'short' | 'long' | 'holed'
export type Line = 'left' | 'center' | 'right'
export type MissType =
  | 'slice' | 'hook' | 'push' | 'pull' | 'fat' | 'thin'
  | 'top' | 'chunk' | 'shank' | 'short' | 'long' | 'none'

export interface Conditions {
  windSpeed: number // mph
  windDir: WindDir
  elevationFt: number // + uphill to target, - downhill
  tempF: number
  firmness: Firmness
  wet: boolean
  slope: SlopeLie
}

// ── Normalization engine output ─────────────────────────────────────────

export interface Adjustment {
  factor: string
  yards: number // effect the condition had on the raw number (+ helped, - hurt)
  note: string
}

export interface NormalizedShot {
  rawDistance: number
  normalizedCarry: number
  normalizedTotal: number
  adjustments: Adjustment[]
  strikeFactor: number // 0..1 quality multiplier applied
  summary: string
}

// ── Logged shots ────────────────────────────────────────────────────────

export interface ShotInput {
  clubId: ClubId
  intendedDistance: number
  actualDistance: number
  line: Line
  contact: Contact
  shape: ShotShape
  lie: Lie
  conditions: Conditions
  outcome: Outcome
}

export interface LoggedShot extends ShotInput {
  id: string
  ts: number
  holeNumber: number
  shotNumber: number
  normalized: NormalizedShot
  feedback: string
}

// ── Rounds & courses ────────────────────────────────────────────────────

export interface Hazard {
  type: 'water' | 'bunker' | 'ob' | 'trees' | 'creek' | 'waste'
  side: 'left' | 'right' | 'cross' | 'front' | 'behind'
  fromTee?: number // yards from tee where it comes into play
  note: string
}

export interface Hole {
  number: number
  par: 3 | 4 | 5
  yards: number
  handicap: number
  shape: 'straight' | 'dogleg-left' | 'dogleg-right'
  elevationFt: number
  hazards: Hazard[]
  strategy: string
}

export interface Course {
  id: string
  name: string
  location: string
  style: 'premium' | 'municipal'
  rating: number
  slope: number
  holes: Hole[]
}

export interface HoleResult {
  holeNumber: number
  par: number
  strokes: number
  putts: number
  fairway: 'hit' | 'left' | 'right' | 'na'
  gir: boolean
  penalties: number
  shots: LoggedShot[]
}

export interface Round {
  id: string
  courseId: string
  date: string // ISO
  status: 'active' | 'complete'
  currentHole: number
  conditions: Conditions
  holes: HoleResult[]
  recap?: string
}

// ── Range ───────────────────────────────────────────────────────────────

export type RangeGoal =
  | 'fix-slice' | 'driver-accuracy' | 'dial-wedges' | 'iron-contact'
  | 'add-distance' | 'stock-yardages' | 'course-sim' | 'pressure' | 'warmup'

export type FeedbackTag =
  | 'great' | 'good' | 'straight'
  | 'slice' | 'hook' | 'push' | 'pull'
  | 'fat' | 'thin' | 'topped' | 'bladed' | 'duffed' | 'shanked'
  | 'too-hard' | 'too-soft' | 'short' | 'long'
  | 'bad-contact' | 'wrong-club' | 'bad-alignment' | 'bad-tempo'
  | 'toe' | 'heel' | 'center'

export interface RangeShot {
  id: string
  n: number
  clubId: ClubId
  depth: 'short' | 'on' | 'long'
  line: Line
  tags: FeedbackTag[]
  carry: number
  feedback: string
}

export interface RangeSession {
  id: string
  date: string
  goal: RangeGoal
  clubIds: ClubId[]
  drillId: string
  status: 'active' | 'complete'
  shots: RangeShot[]
  score: number // 0-100 practice score
  summary?: string
}

// ── Drills ──────────────────────────────────────────────────────────────

export interface Drill {
  id: string
  name: string
  category: 'driver' | 'irons' | 'wedges' | 'putting' | 'short-game' | 'mixed'
  goals: RangeGoal[]
  objective: string
  setup: string
  reps: string
  scoring: string
  track: string
  success: string
  cue: string
  progression: string
  minutes: number
}

// ── Player profile ──────────────────────────────────────────────────────

export type Goal =
  | 'lower-scores' | 'fix-slice' | 'add-distance' | 'improve-irons'
  | 'short-game' | 'putting' | 'consistency'

export interface PlayerProfile {
  name: string
  handicap: number
  typicalScore: number
  hand: 'right' | 'left'
  homeCourseId: string
  goals: Goal[]
  commonMiss: MissType
  preferredShape: ShotShape
  practiceFrequency: 'rarely' | '1x-week' | '2-3x-week' | 'daily'
}

// ── App state ───────────────────────────────────────────────────────────

export interface AppState {
  version: number
  onboarded: boolean
  profile: PlayerProfile
  bag: BagClub[]
  rounds: Round[]
  rangeSessions: RangeSession[]
  activeRoundId: string | null
  activeRangeId: string | null
}

export type Tab = 'home' | 'play' | 'range' | 'insights' | 'profile'

// ── Derived analytics ───────────────────────────────────────────────────

export interface ClubStats {
  clubId: ClubId
  shots: number
  rawAvg: number
  normalizedAvg: number
  carry: number
  total: number
  confidence: number // 0-100
  dispersion: number // yards, lateral 1-sigma estimate
  commonMiss: string
  recommendation: string
}

export interface CaddieAdvice {
  club: ClubId
  altClub?: ClubId
  target: string
  rationale: string[]
  playsLike: number
  riskLevel: number // 0-100
  expectedStrokes: number
  aggressive: {
    club: ClubId
    target: string
    gain: number
    penaltyRisk: number
  }
}
