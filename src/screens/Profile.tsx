import { useMemo, useState } from 'react'
import type { Goal, MissType, ShotShape } from '../types'
import { getClub, orderedBag } from '../data/clubs'
import { getCourse } from '../data/courses'
import { computeClubStats } from '../lib/insights'
import { exportState } from '../lib/storage'
import { useAppState } from '../hooks/useAppState'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { Badge, Button, Card, Chip, Field, SectionTitle, Sheet, inputClass } from '../components/ui'

const GOALS: { id: Goal; label: string }[] = [
  { id: 'lower-scores', label: 'Lower scores' },
  { id: 'fix-slice', label: 'Fix slice' },
  { id: 'add-distance', label: 'Distance' },
  { id: 'improve-irons', label: 'Irons' },
  { id: 'short-game', label: 'Short game' },
  { id: 'putting', label: 'Putting' },
  { id: 'consistency', label: 'Consistency' },
]
const MISSES: MissType[] = ['slice', 'hook', 'push', 'pull', 'fat', 'thin', 'top', 'chunk', 'shank', 'short', 'long']
const SHAPES: ShotShape[] = ['straight', 'fade', 'draw']

export function Profile() {
  const { state, dispatch } = useAppState()
  const { canInstall, installed, install } = useInstallPrompt()
  const stats = useMemo(() => computeClubStats(state), [state])
  const [editClub, setEditClub] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const p = state.profile

  const toggleGoal = (g: Goal) =>
    dispatch({
      type: 'UPDATE_PROFILE',
      profile: { goals: p.goals.includes(g) ? p.goals.filter((x) => x !== g) : [...p.goals, g] },
    })

  const editing = state.bag.find((b) => b.clubId === editClub)

  return (
    <div className="animate-fade">
      {/* Player card */}
      <Card glow className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-3 text-2xl font-bold text-accent-bright">
          {p.name.slice(0, 1).toUpperCase() || 'A'}
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold">{p.name || 'Player'}</div>
          <div className="text-[13px] text-muted">
            HCP {p.handicap.toFixed(1)} · typically shoots {p.typicalScore} · {p.hand}-handed
          </div>
          <div className="text-[12px] text-faint mt-0.5">Home: {getCourse(p.homeCourseId).name}</div>
        </div>
      </Card>

      <SectionTitle>Goals</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {GOALS.map((g) => (
          <Chip key={g.id} selected={p.goals.includes(g.id)} onClick={() => toggleGoal(g.id)}>
            {g.label}
          </Chip>
        ))}
      </div>

      <SectionTitle>Game Identity</SectionTitle>
      <Card className="space-y-4">
        <Field label={`Handicap: ${p.handicap.toFixed(1)}`}>
          <input
            type="range" min={0} max={36} step={0.1} value={p.handicap}
            onChange={(e) => dispatch({ type: 'UPDATE_PROFILE', profile: { handicap: Number(e.target.value) } })}
            className="w-full accent-[#10b981]"
          />
        </Field>
        <Field label="Common miss">
          <div className="flex flex-wrap gap-2">
            {MISSES.map((m) => (
              <Chip key={m} selected={p.commonMiss === m} onClick={() => dispatch({ type: 'UPDATE_PROFILE', profile: { commonMiss: m } })}>
                {m}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Preferred shape">
          <div className="flex gap-2">
            {SHAPES.map((s) => (
              <Chip key={s} selected={p.preferredShape === s} onClick={() => dispatch({ type: 'UPDATE_PROFILE', profile: { preferredShape: s } })}>
                {s}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Practice schedule">
          <div className="flex flex-wrap gap-2">
            {([
              ['rarely', 'Rarely'], ['1x-week', '1× / week'], ['2-3x-week', '2–3× / week'], ['daily', 'Daily'],
            ] as const).map(([id, label]) => (
              <Chip key={id} selected={p.practiceFrequency === id} onClick={() => dispatch({ type: 'UPDATE_PROFILE', profile: { practiceFrequency: id } })}>
                {label}
              </Chip>
            ))}
          </div>
        </Field>
      </Card>

      <SectionTitle>My Bag</SectionTitle>
      <Card className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_3rem_3rem_3rem_3.5rem] items-center gap-1 border-b border-line bg-surface-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-faint">
          <span>Club</span><span className="text-right">Carry</span><span className="text-right">Total</span><span className="text-right">True</span><span className="text-right">Conf</span>
        </div>
        {orderedBag(state.bag).filter((b) => b.clubId !== 'PT').map((b) => {
          const s = stats.find((x) => x.clubId === b.clubId)
          return (
            <button
              key={b.clubId}
              onClick={() => setEditClub(b.clubId)}
              className="grid w-full grid-cols-[1fr_3rem_3rem_3rem_3.5rem] items-center gap-1 border-b border-line/50 px-4 py-2.5 text-left text-[13px] last:border-0 active:bg-surface-2"
            >
              <span className="font-semibold">{getClub(b.clubId).label}</span>
              <span className="text-right tabular-nums text-muted">{b.carry}</span>
              <span className="text-right tabular-nums text-muted">{b.total}</span>
              <span className="text-right tabular-nums font-semibold text-accent-bright">{s?.normalizedAvg ?? '—'}</span>
              <span className="text-right">
                <Badge tone={(s?.confidence ?? 0) >= 70 ? 'good' : (s?.confidence ?? 0) >= 45 ? 'gold' : 'bad'}>{s?.confidence ?? 0}%</Badge>
              </span>
            </button>
          )
        })}
      </Card>
      <p className="mt-2 px-1 text-[11px] text-faint">
        Tap a club to edit your stock numbers. "True" is the normalized average from logged shots.
      </p>

      <SectionTitle>App</SectionTitle>
      <div className="space-y-2.5">
        {!installed && (
          <Card className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold">Install as App</div>
              <div className="text-[12px] text-muted">{canInstall ? 'Offline-ready PWA' : 'Use browser menu → Add to Home Screen'}</div>
            </div>
            {canInstall && <Button size="sm" onClick={install}>Install</Button>}
          </Card>
        )}
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">Export data</div>
            <div className="text-[12px] text-muted">Download all rounds, sessions & settings as JSON</div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => exportState(state)}>Export</Button>
        </Card>
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">Demo reset</div>
            <div className="text-[12px] text-muted">Restore seeded demo data & rerun onboarding</div>
          </div>
          <Button size="sm" variant="danger" onClick={() => setConfirmReset(true)}>Reset</Button>
        </Card>
      </div>

      <p className="mt-6 text-center text-[11px] text-faint">TrueCaddie prototype · v0.1 · all data stays on this device</p>

      {/* Edit club sheet */}
      <Sheet open={!!editing} onClose={() => setEditClub(null)} title={editing ? `Edit ${getClub(editing.clubId).label}` : ''}>
        {editing && (
          <div className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock carry (yds)">
                <input
                  type="number" className={inputClass} value={editing.carry}
                  onChange={(e) =>
                    dispatch({ type: 'UPDATE_BAG_CLUB', clubId: editing.clubId, carry: Number(e.target.value) || 0, total: editing.total })
                  }
                />
              </Field>
              <Field label="Stock total (yds)">
                <input
                  type="number" className={inputClass} value={editing.total}
                  onChange={(e) =>
                    dispatch({ type: 'UPDATE_BAG_CLUB', clubId: editing.clubId, carry: editing.carry, total: Number(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>
            {(() => {
              const s = stats.find((x) => x.clubId === editing.clubId)
              if (!s || s.shots === 0) return <p className="text-[13px] text-muted">No logged shots yet — play a round or hit the range to build the true number.</p>
              return (
                <Card>
                  <div className="text-[12px] font-bold uppercase tracking-wider text-faint mb-2">From your data</div>
                  <div className="space-y-1 text-[13px] text-muted">
                    <div>Raw average: <span className="text-ink font-semibold">{s.rawAvg} yds</span></div>
                    <div>Normalized (true): <span className="text-accent-bright font-semibold">{s.normalizedAvg} yds</span></div>
                    <div>Dispersion: <span className="text-ink font-semibold">±{s.dispersion} yds</span></div>
                    <div>Common miss: <span className="text-ink font-semibold">{s.commonMiss}</span></div>
                    <div className="pt-1">{s.recommendation}</div>
                  </div>
                </Card>
              )
            })()}
            <Button size="lg" className="w-full" onClick={() => setEditClub(null)}>Done</Button>
          </div>
        )}
      </Sheet>

      {/* Reset confirm */}
      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?">
        <div className="space-y-4 pb-4">
          <p className="text-[14px] text-muted">
            This wipes your local data and restores the seeded demo player (3 rounds, 2 range sessions). You'll go through onboarding again.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { dispatch({ type: 'RESET_DEMO' }); setConfirmReset(false) }}>Reset everything</Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
