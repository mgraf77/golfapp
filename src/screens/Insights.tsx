import { useMemo, useState } from 'react'
import { getClub } from '../data/clubs'
import { computeHandicap, courseHandicap, fmtIndex } from '../lib/handicap'
import {
  allShots, bestAndWorstClub, computeClubStats, computeWeaknesses, gappingWarnings,
  rangeTrend, scoreTrend, strokesLostByCategory,
} from '../lib/insights'
import { roundStrokesGained, sgLabel, sgPriorities, type SgCategory } from '../lib/strokesGained'
import { useAppState } from '../hooks/useAppState'
import { GappingChart, HBarChart, TrendChart } from '../components/charts'
import { FeedbackCard } from '../components/FeedbackCard'
import { Badge, Button, Card, Field, Meter, SectionTitle, Segmented, Sheet, StatCard, inputClass } from '../components/ui'
import { fmtDate, pct } from '../lib/utils'

type View = 'scoring' | 'clubs' | 'tendencies' | 'trends'

export function Insights() {
  const { state } = useAppState()
  const [view, setView] = useState<View>('scoring')

  const stats = useMemo(() => computeClubStats(state), [state])
  const weaknesses = useMemo(() => computeWeaknesses(state), [state])
  const losses = useMemo(() => strokesLostByCategory(state), [state])
  const trend = useMemo(() => scoreTrend(state.rounds), [state.rounds])
  const practice = useMemo(() => rangeTrend(state.rangeSessions), [state.rangeSessions])
  const { best, worst } = useMemo(() => bestAndWorstClub(stats), [stats])
  const gapping = useMemo(() => gappingWarnings(stats), [stats])
  const shots = useMemo(() => allShots(state.rounds), [state.rounds])

  return (
    <div className="animate-fade">
      <Segmented
        options={[
          { value: 'scoring', label: 'Scoring' },
          { value: 'clubs', label: 'Clubs' },
          { value: 'tendencies', label: 'Misses' },
          { value: 'trends', label: 'Trends' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'scoring' && <ScoringView />}

      {view === 'clubs' && (
        <div className="animate-fade">
          <SectionTitle>Raw vs Normalized Distance</SectionTitle>
          <Card>
            <p className="text-[12px] text-muted mb-3 leading-snug">
              Raw averages include wind, slopes, and lucky bounces. The normalized number is what your swing is actually worth — and what the caddie uses.
            </p>
            <GappingChart rows={stats.map((s) => ({ clubId: s.clubId, raw: s.rawAvg, normalized: s.normalizedAvg }))} />
          </Card>

          {gapping.length > 0 && (
            <FeedbackCard title="Gapping Analysis" tone="warn" className="mt-3">
              {gapping.join(' ')}
            </FeedbackCard>
          )}

          <SectionTitle>Best / Worst</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Highest Confidence" tone="good" value={getClub(best.clubId).label} sub={`${best.confidence}% · ${best.commonMiss}`} />
            <StatCard label="Needs Work" tone="bad" value={getClub(worst.clubId).label} sub={`${worst.confidence}% · ${worst.commonMiss}`} />
          </div>

          <SectionTitle>Club Detail</SectionTitle>
          <div className="space-y-2.5">
            {stats.map((s) => (
              <Card key={s.clubId}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px]">{getClub(s.clubId).label}</span>
                    <Badge tone={s.confidence >= 70 ? 'good' : s.confidence >= 45 ? 'gold' : 'bad'}>{s.confidence}%</Badge>
                  </div>
                  <span className="text-[12px] text-faint">{s.shots} shots logged</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  <MiniStat label="Raw" value={s.rawAvg} />
                  <MiniStat label="True" value={s.normalizedAvg} accent />
                  <MiniStat label="Carry" value={s.carry} />
                  <MiniStat label="±Disp" value={s.dispersion} />
                </div>
                <div className="mt-2 text-[12px] text-muted">
                  <span className="text-faint">Miss:</span> {s.commonMiss} · <span className="text-faint">Use:</span> {s.recommendation}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view === 'tendencies' && (
        <div className="animate-fade">
          <SectionTitle>Strokes Lost / Round</SectionTitle>
          <Card>
            <HBarChart rows={losses.map((l) => ({ label: l.category, value: l.strokes }))} unit=" sg" />
          </Card>

          <SectionTitle>The Story</SectionTitle>
          <div className="space-y-2.5">
            {weaknesses.map((w) => (
              <FeedbackCard key={w.title} title={w.title} tone="warn">
                {w.detail}
              </FeedbackCard>
            ))}
            <FeedbackCard title="What's Working" tone="good">
              Your {getClub(best.clubId).label.toLowerCase()} is your highest-confidence club ({best.confidence}%). You gain strokes when
              your game plan creates {getClub(best.clubId).label.toLowerCase()} numbers — and when you aim away from {state.profile.commonMiss}-side hazards.
            </FeedbackCard>
          </div>

          <SectionTitle>Miss Breakdown (all logged shots)</SectionTitle>
          <Card>
            <MissMatrix
              left={pct(shots.filter((s) => s.line === 'left').length, shots.length)}
              center={pct(shots.filter((s) => s.line === 'center').length, shots.length)}
              right={pct(shots.filter((s) => s.line === 'right').length, shots.length)}
              pure={pct(shots.filter((s) => s.contact === 'pure').length, shots.length)}
            />
          </Card>
        </div>
      )}

      {view === 'trends' && (
        <div className="animate-fade">
          <SectionTitle>Score Trend (18-hole pace)</SectionTitle>
          <Card>
            {trend.length >= 2 ? (
              <TrendChart points={trend.map((t) => ({ label: fmtDate(t.date), value: t.score }))} invert />
            ) : (
              <p className="text-sm text-muted text-center py-6">Play two rounds to unlock your trend line.</p>
            )}
          </Card>

          <SectionTitle>Practice Score Trend</SectionTitle>
          <Card>
            {practice.length >= 2 ? (
              <TrendChart points={practice.map((t) => ({ label: fmtDate(t.date), value: t.score }))} />
            ) : (
              <p className="text-sm text-muted text-center py-6">Complete two range sessions to see practice progress.</p>
            )}
          </Card>

          <SectionTitle>History</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Rounds Logged" value={state.rounds.filter((r) => r.status === 'complete').length} sub="with full shot data" />
            <StatCard label="Range Sessions" value={state.rangeSessions.filter((s) => s.status === 'complete').length} sub={`${state.rangeSessions.reduce((a, s) => a + s.shots.length, 0)} total reps`} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Scoring: WHS handicap + strokes gained ──────────────────────────────

function ScoringView() {
  const { state, dispatch } = useAppState()
  const [showAdd, setShowAdd] = useState(false)
  const whs = useMemo(() => computeHandicap(state.scores), [state.scores])
  const priorities = useMemo(() => sgPriorities(state.rounds), [state.rounds])
  const lastRound = [...state.rounds].filter((r) => r.status === 'complete').sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastSg = useMemo(() => (lastRound ? roundStrokesGained(lastRound) : null), [lastRound])
  const recentScores = [...state.scores].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20)

  // best-8 marker: which differentials count right now
  const counting = new Set(
    [...state.scores]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-20)
      .sort((a, b) => a.differential - b.differential)
      .slice(0, whs.used)
      .map((s) => s.id),
  )

  return (
    <div className="animate-fade">
      <SectionTitle>WHS Handicap Index</SectionTitle>
      <Card glow>
        <div className="flex items-center gap-4">
          <div className="text-center shrink-0">
            <div className="text-4xl font-extrabold tabular-nums text-accent-bright">{fmtIndex(whs.index)}</div>
            <div className="text-[10px] uppercase tracking-wider text-faint mt-0.5">Index</div>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] text-muted leading-relaxed">{whs.message}</p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {whs.lowIndex != null && <Badge>Low {fmtIndex(whs.lowIndex)}</Badge>}
              {whs.capApplied !== 'none' && <Badge tone="gold">{whs.capApplied} cap applied</Badge>}
            </div>
          </div>
        </div>
        {whs.trend.length >= 2 && (
          <div className="mt-4">
            <TrendChart points={whs.trend.slice(-12).map((v, i) => ({ label: `${i}`, value: v }))} invert />
          </div>
        )}
        {whs.index != null && (
          <div className="mt-3 rounded-xl bg-surface-2 border border-line px-3.5 py-2.5 text-[13px] text-muted">
            Course handicap at a typical course (slope 125, CR 71.2, par 72):{' '}
            <span className="font-bold text-ink">{courseHandicap(whs.index, 125, 71.2, 72)}</span>
          </div>
        )}
      </Card>

      <SectionTitle>Strokes gained (vs scratch baseline)</SectionTitle>
      <Card>
        {priorities.length ? (
          <>
            <div className="flex flex-col gap-3">
              {priorities.map((p) => (
                <SgBar key={p.cat} cat={p.cat} value={p.avg} />
              ))}
            </div>
            <p className="text-[12px] text-muted mt-3 leading-relaxed">
              <span className="text-ink font-medium">Biggest leak: {sgLabel(priorities[0].cat).toLowerCase()}</span>{' '}
              ({priorities[0].avg > 0 ? '+' : ''}{priorities[0].avg.toFixed(1)}/round). GPS-tracked rounds make these
              numbers exact — card-mode rounds are estimated from your logs.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted text-center py-4">Complete a round to unlock strokes-gained analysis.</p>
        )}
      </Card>

      {lastSg && lastRound && (
        <>
          <SectionTitle>Last round breakdown</SectionTitle>
          <Card>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-sm font-semibold">{lastRound.courseName ?? 'Round'} · {fmtDate(lastRound.date)}</span>
              <span className={`text-lg font-bold tabular-nums ${lastSg.total >= 0 ? 'text-accent-bright' : 'text-danger'}`}>
                {lastSg.total > 0 ? '+' : ''}{lastSg.total.toFixed(1)} SG
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {([['OTT', lastSg.ott], ['APP', lastSg.app], ['ARG', lastSg.arg], ['PUTT', lastSg.putt]] as const).map(([cat, v]) => (
                <div key={cat} className={`rounded-xl border py-2.5 ${v < -1 ? 'border-danger/40 bg-danger/8' : 'border-line bg-surface-2'}`}>
                  <div className={`text-[15px] font-bold tabular-nums ${v >= 0 ? 'text-accent-bright' : v < -1 ? 'text-danger' : 'text-gold'}`}>
                    {v > 0 ? '+' : ''}{v.toFixed(1)}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-faint mt-0.5">{cat}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <SectionTitle
        action={
          <button onClick={() => setShowAdd(true)} className="text-[13px] font-semibold text-accent-bright">+ Post score</button>
        }
      >
        Scoring record
      </SectionTitle>
      {recentScores.length === 0 ? (
        <Card className="text-sm text-muted">Finish rounds (or post scores manually) to build your handicap record.</Card>
      ) : (
        <Card className="!p-2">
          {recentScores.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-2.5 py-2 border-b border-line/50 last:border-0">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{s.courseName}</div>
                <div className="text-[11px] text-faint">{fmtDate(s.date)} · CR {s.rating} / {s.slope}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold tabular-nums">{s.adjustedGross}</span>
                <span className={`text-[12px] tabular-nums w-12 text-right ${counting.has(s.id) ? 'text-accent-bright font-bold' : 'text-faint'}`}>
                  {s.differential.toFixed(1)}{counting.has(s.id) ? ' ✓' : ''}
                </span>
                {!s.roundId && (
                  <button onClick={() => dispatch({ type: 'DELETE_SCORE', id: s.id })} className="text-faint text-xs">✕</button>
                )}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-faint px-2.5 pt-2 pb-1">✓ = counting toward your index right now</p>
        </Card>
      )}

      <AddScoreSheet open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}

function SgBar({ cat, value }: { cat: SgCategory; value: number }) {
  const width = Math.min(100, (Math.abs(value) / 4) * 100)
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-24 text-[12px] text-muted shrink-0">{sgLabel(cat)}</span>
      <div className="flex-1 h-4 relative">
        <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
        <div
          className={`absolute inset-y-0.5 rounded ${value >= 0 ? 'left-1/2 bg-accent' : 'right-1/2 bg-danger/70'}`}
          style={{ width: `${width / 2}%` }}
        />
      </div>
      <span className={`w-11 text-right text-[13px] font-bold tabular-nums ${value >= 0 ? 'text-accent-bright' : 'text-danger'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </span>
    </div>
  )
}

function AddScoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useAppState()
  const [course, setCourse] = useState('')
  const [gross, setGross] = useState('85')
  const [rating, setRating] = useState('71.2')
  const [slope, setSlope] = useState('125')
  const [par, setPar] = useState('72')

  function save() {
    dispatch({
      type: 'ADD_SCORE',
      entry: {
        date: new Date().toISOString(),
        courseName: course.trim() || 'Manual score',
        adjustedGross: Number(gross) || 85,
        rating: Number(rating) || 71.2,
        slope: Number(slope) || 125,
        par: Number(par) || 72,
        holes: 18,
      },
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Post a score">
      <div className="flex flex-col gap-3 pb-2">
        <Field label="Course name">
          <input className={inputClass} value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Pine Valley GC" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Adjusted gross score">
            <input className={inputClass} type="number" inputMode="numeric" value={gross} onChange={(e) => setGross(e.target.value)} />
          </Field>
          <Field label="Par">
            <input className={inputClass} type="number" inputMode="numeric" value={par} onChange={(e) => setPar(e.target.value)} />
          </Field>
          <Field label="Course rating">
            <input className={inputClass} type="number" inputMode="decimal" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} />
          </Field>
          <Field label="Slope">
            <input className={inputClass} type="number" inputMode="numeric" value={slope} onChange={(e) => setSlope(e.target.value)} />
          </Field>
        </div>
        <p className="text-[11px] text-faint leading-relaxed">
          Rating and slope are printed on the scorecard. Remember WHS uses net double bogey as the max per-hole score.
        </p>
        <Button size="lg" onClick={save}>Post score</Button>
      </div>
    </Sheet>
  )
}

function MiniStat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-2 py-1.5">
      <div className={`text-[15px] font-bold tabular-nums ${accent ? 'text-accent-bright' : ''}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  )
}

function MissMatrix({ left, center, right, pure }: { left: number; center: number; right: number; pure: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: '← Left', v: left },
          { label: 'On line', v: center },
          { label: 'Right →', v: right },
        ].map((x) => (
          <div key={x.label} className={`rounded-xl border py-3 ${x.v >= 40 ? 'border-danger/40 bg-danger/10' : 'border-line bg-surface-2'}`}>
            <div className="text-xl font-bold tabular-nums">{x.v}%</div>
            <div className="text-[11px] text-muted">{x.label}</div>
          </div>
        ))}
      </div>
      <Meter value={pure} tone="good" label="Pure contact rate" />
    </div>
  )
}
