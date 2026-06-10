import { useState } from 'react'
import type { BagClub, Goal, MissType, PlayerProfile, ShotShape } from '../types'
import { CLUB_CATALOG, defaultBag } from '../data/clubs'
import { COURSES } from '../data/courses'
import { useAppState } from '../hooks/useAppState'
import { Button, Chip, Field, inputClass } from '../components/ui'

const GOALS: { id: Goal; label: string }[] = [
  { id: 'lower-scores', label: 'Lower scores' },
  { id: 'fix-slice', label: 'Fix my slice' },
  { id: 'add-distance', label: 'Add distance' },
  { id: 'improve-irons', label: 'Improve irons' },
  { id: 'short-game', label: 'Short game' },
  { id: 'putting', label: 'Putting' },
  { id: 'consistency', label: 'Consistency' },
]

const MISSES: MissType[] = ['slice', 'hook', 'push', 'pull', 'fat', 'thin', 'top', 'chunk', 'shank', 'short', 'long']
const SHAPES: ShotShape[] = ['straight', 'fade', 'draw']
const FREQS: { id: PlayerProfile['practiceFrequency']; label: string }[] = [
  { id: 'rarely', label: 'Rarely' },
  { id: '1x-week', label: '1× / week' },
  { id: '2-3x-week', label: '2–3× / week' },
  { id: 'daily', label: 'Daily' },
]

export function Onboarding() {
  const { state, dispatch } = useAppState()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<PlayerProfile>(state.profile)
  const [bag, setBag] = useState<BagClub[]>(defaultBag())

  const set = (p: Partial<PlayerProfile>) => setProfile((prev) => ({ ...prev, ...p }))
  const toggleGoal = (g: Goal) =>
    set({ goals: profile.goals.includes(g) ? profile.goals.filter((x) => x !== g) : [...profile.goals, g] })

  const steps = 5
  const next = () => setStep((s) => Math.min(s + 1, steps - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))
  const finish = () => dispatch({ type: 'COMPLETE_ONBOARDING', profile, bag })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),24px)] pb-8">
      {/* progress */}
      <div className="mb-6 flex items-center gap-3">
        {step > 0 ? (
          <button onClick={back} className="text-muted text-sm">← Back</button>
        ) : (
          <span className="text-accent-bright font-bold text-sm">TrueCaddie</span>
        )}
        <div className="flex-1 h-1 rounded-full bg-surface-3 overflow-hidden">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${((step + 1) / steps) * 100}%` }} />
        </div>
        <span className="text-[11px] text-faint tabular-nums">{step + 1}/{steps}</span>
      </div>

      <div key={step} className="flex-1 animate-rise">
        {step === 0 && (
          <div className="flex h-full flex-col justify-center text-center gap-4 py-10">
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-2 border border-accent/30 shadow-[0_0_60px_-15px_rgba(16,185,129,0.5)]">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-accent-bright" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" d="M10 3v12.5M10 3l7 2.2L10 8" />
                <ellipse cx="11.5" cy="18.5" rx="5" ry="1.8" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">TrueCaddie</h1>
            <p className="text-muted text-[15px] leading-relaxed px-4">
              An AI caddie, range coach, and shot-intelligence engine. It learns your <span className="text-accent-bright font-medium">true</span> distances,
              your real miss patterns, and tells you the next best decision — on the course and on the range.
            </p>
            <Field label="What should we call you?">
              <input className={inputClass} value={profile.name} onChange={(e) => set({ name: e.target.value })} placeholder="Your name" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold">Your game today</h2>
            <p className="text-muted text-sm -mt-3">Honest numbers make a smarter caddie.</p>
            <Field label={`Handicap: ${profile.handicap.toFixed(1)}`}>
              <input
                type="range" min={0} max={36} step={0.1} value={profile.handicap}
                onChange={(e) => set({ handicap: Number(e.target.value) })}
                className="w-full accent-[#10b981]"
              />
            </Field>
            <Field label="Typical 18-hole score">
              <input
                type="number" className={inputClass} value={profile.typicalScore}
                onChange={(e) => set({ typicalScore: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Dominant hand">
              <div className="flex gap-2">
                {(['right', 'left'] as const).map((h) => (
                  <Chip key={h} selected={profile.hand === h} onClick={() => set({ hand: h })}>
                    {h === 'right' ? 'Right-handed' : 'Left-handed'}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Home course">
              <div className="space-y-2">
                {COURSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => set({ homeCourseId: c.id })}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${profile.homeCourseId === c.id ? 'border-accent bg-accent/10' : 'border-line bg-surface-2'}`}
                  >
                    <div className="font-semibold text-[14px]">{c.name}</div>
                    <div className="text-[12px] text-muted">{c.location} · {c.rating} / {c.slope}</div>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold">What are we fixing?</h2>
            <p className="text-muted text-sm -mt-3">Pick everything that applies — the practice engine prioritizes from here.</p>
            <Field label="Goals">
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <Chip key={g.id} selected={profile.goals.includes(g.id)} onClick={() => toggleGoal(g.id)}>
                    {g.label}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Most common miss">
              <div className="flex flex-wrap gap-2">
                {MISSES.map((m) => (
                  <Chip key={m} selected={profile.commonMiss === m} onClick={() => set({ commonMiss: m })}>
                    {m}
                  </Chip>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold">Shape & habits</h2>
            <Field label="Preferred shot shape">
              <div className="flex gap-2">
                {SHAPES.map((s) => (
                  <Chip key={s} selected={profile.preferredShape === s} onClick={() => set({ preferredShape: s })}>
                    {s}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="How often do you practice?">
              <div className="flex flex-wrap gap-2">
                {FREQS.map((f) => (
                  <Chip key={f.id} selected={profile.practiceFrequency === f.id} onClick={() => set({ practiceFrequency: f.id })}>
                    {f.label}
                  </Chip>
                ))}
              </div>
            </Field>
            <div className="rounded-2xl border border-line bg-surface-2 p-4 text-[13px] text-muted leading-relaxed">
              <span className="text-accent-bright font-semibold">Why this matters:</span> your miss pattern changes which hazards
              are actually dangerous for <em>you</em>. A slicer and a hooker should never get the same tee-shot advice.
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your bag & stock numbers</h2>
            <p className="text-muted text-sm -mt-2">
              Best-guess totals are fine — TrueCaddie replaces them with <span className="text-accent-bright">normalized</span> values as you log shots.
            </p>
            <div className="rounded-2xl border border-line bg-surface overflow-hidden">
              {CLUB_CATALOG.filter((c) => c.id !== 'PT').map((c) => {
                const inBag = bag.some((b) => b.clubId === c.id)
                const entry = bag.find((b) => b.clubId === c.id)
                return (
                  <div key={c.id} className="flex items-center gap-3 border-b border-line/60 px-4 py-2 last:border-0">
                    <button
                      onClick={() =>
                        setBag((prev) =>
                          inBag
                            ? prev.filter((b) => b.clubId !== c.id)
                            : [...prev, { clubId: c.id, carry: c.defaultCarry, total: c.defaultTotal }],
                        )
                      }
                      className={`flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-bold transition-all ${inBag ? 'bg-accent border-accent text-[#04130d]' : 'border-line text-transparent'}`}
                    >
                      ✓
                    </button>
                    <span className="w-24 text-[13px] font-medium">{c.label}</span>
                    <input
                      type="number"
                      disabled={!inBag}
                      value={entry?.total ?? c.defaultTotal}
                      onChange={(e) => {
                        const total = Number(e.target.value) || 0
                        setBag((prev) =>
                          prev.map((b) => (b.clubId === c.id ? { ...b, total, carry: Math.round(total * 0.95) } : b)),
                        )
                      }}
                      className="ml-auto w-16 rounded-lg border border-line bg-surface-2 px-2 py-1 text-right text-[13px] tabular-nums disabled:opacity-30"
                    />
                    <span className="text-[11px] text-faint">yds</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pt-5">
        {step < steps - 1 ? (
          <Button size="lg" className="w-full" onClick={next} disabled={step === 0 && !profile.name.trim()}>
            Continue
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={finish}>
            Build my player model →
          </Button>
        )}
        {step === 0 && (
          <button onClick={finish} className="mt-3 w-full text-center text-[13px] text-faint">
            Skip — explore with demo data
          </button>
        )}
      </div>
    </div>
  )
}
