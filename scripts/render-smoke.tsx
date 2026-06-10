// Render smoke test: server-renders every screen with seeded state.
// Catches render-time crashes (undefined access, bad data assumptions, etc).
import { renderToString } from 'react-dom/server'
import type { ReactNode } from 'react'
import App from '../src/App'
import { AppStateProvider } from '../src/hooks/useAppState'
import { Home } from '../src/screens/Home'
import { Play } from '../src/screens/Play'
import { Range } from '../src/screens/Range'
import { Insights } from '../src/screens/Insights'
import { Profile } from '../src/screens/Profile'
import { buildSeedState } from '../src/data/seed'

// ── browser shims ──────────────────────────────────────────────────────
const store = new Map<string, string>()
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
}
Object.assign(globalThis, {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
})
;(globalThis as Record<string, unknown>).window = globalThis

let failures = 0
function renderCase(name: string, node: ReactNode, seedMutator?: (s: ReturnType<typeof buildSeedState>) => void) {
  try {
    const seeded = buildSeedState()
    seeded.onboarded = true
    seedMutator?.(seeded)
    store.set('truecaddie-state-v1', JSON.stringify(seeded))
    const html = renderToString(<AppStateProvider>{node}</AppStateProvider>)
    if (html.length < 400) throw new Error('suspiciously short output: ' + html.length)
    console.log(`✓ render ${name} (${html.length} chars)`)
  } catch (e) {
    failures++
    console.error(`✗ render ${name}:`, e)
  }
}

renderCase('App → onboarding (fresh)', <App />, (s) => {
  s.onboarded = false
})
renderCase('App → home', <App />)
renderCase('Home', <Home onNavigate={() => {}} />)
renderCase('Play lobby', <Play />)
renderCase('Play active round (hole 1, no shots)', <Play />, (s) => {
  s.rounds[0].status = 'active'
  s.rounds[0].currentHole = 1
  s.rounds[0].holes = s.rounds[0].holes.map((h) => ({ ...h, strokes: 0, putts: 0, shots: [], penalties: 0, gir: false, fairway: 'na' as const }))
  s.activeRoundId = s.rounds[0].id
})
renderCase('Play active round mid-hole (shots logged)', <Play />, (s) => {
  s.rounds[2].status = 'active'
  s.rounds[2].currentHole = 5
  s.activeRoundId = s.rounds[2].id
})
renderCase('Range lobby', <Range />)
renderCase('Range active session', <Range />, (s) => {
  s.rangeSessions[1].status = 'active'
  s.activeRangeId = s.rangeSessions[1].id
})
renderCase('Range active session (zero shots)', <Range />, (s) => {
  s.rangeSessions[1].status = 'active'
  s.rangeSessions[1].shots = []
  s.activeRangeId = s.rangeSessions[1].id
})
renderCase('Insights', <Insights />)
renderCase('Profile', <Profile />)
renderCase('Empty data — Home', <Home onNavigate={() => {}} />, (s) => {
  s.rounds = []
  s.rangeSessions = []
})
renderCase('Empty data — Play lobby', <Play />, (s) => {
  s.rounds = []
})
renderCase('Empty data — Insights', <Insights />, (s) => {
  s.rounds = []
  s.rangeSessions = []
})

console.log(failures === 0 ? 'RENDER SMOKE PASSED' : `${failures} RENDER FAILURES`)
process.exit(failures === 0 ? 0 : 1)
