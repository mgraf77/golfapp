import { useState } from 'react'
import type { Tab } from './types'
import { useActiveRange, useActiveRound, useAppState } from './hooks/useAppState'
import { AppShell } from './components/AppShell'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { Play } from './screens/Play'
import { Range } from './screens/Range'
import { Insights } from './screens/Insights'
import { Profile } from './screens/Profile'

const TITLES: Record<Tab, { title: string; subtitle?: string }> = {
  home: { title: 'Dashboard', subtitle: 'Your real game, normalized' },
  play: { title: 'Play', subtitle: 'On-course AI caddie' },
  range: { title: 'Range', subtitle: 'Practice that transfers' },
  insights: { title: 'Insights', subtitle: 'Where strokes come from' },
  profile: { title: 'Profile', subtitle: 'Player model & bag' },
}

export default function App() {
  const { state } = useAppState()
  const [tab, setTab] = useState<Tab>('home')
  const activeRound = useActiveRound()
  const activeRange = useActiveRange()

  if (!state.onboarded) return <Onboarding />

  const sub =
    tab === 'play' && activeRound ? 'Round in progress' :
    tab === 'range' && activeRange ? 'Session in progress' :
    TITLES[tab].subtitle

  return (
    <AppShell tab={tab} onTabChange={setTab} title={TITLES[tab].title} subtitle={sub}>
      {tab === 'home' && <Home onNavigate={setTab} />}
      {tab === 'play' && <Play />}
      {tab === 'range' && <Range />}
      {tab === 'insights' && <Insights />}
      {tab === 'profile' && <Profile />}
    </AppShell>
  )
}
