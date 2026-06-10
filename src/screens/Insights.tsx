import { useMemo, useState } from 'react'
import { getClub } from '../data/clubs'
import {
  allShots, bestAndWorstClub, computeClubStats, computeWeaknesses, gappingWarnings,
  rangeTrend, scoreTrend, strokesLostByCategory,
} from '../lib/insights'
import { useAppState } from '../hooks/useAppState'
import { GappingChart, HBarChart, TrendChart } from '../components/charts'
import { FeedbackCard } from '../components/FeedbackCard'
import { Badge, Card, Meter, SectionTitle, Segmented, StatCard } from '../components/ui'
import { fmtDate, pct } from '../lib/utils'

type View = 'clubs' | 'tendencies' | 'trends'

export function Insights() {
  const { state } = useAppState()
  const [view, setView] = useState<View>('clubs')

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
          { value: 'clubs', label: 'Clubs' },
          { value: 'tendencies', label: 'Tendencies' },
          { value: 'trends', label: 'Trends' },
        ]}
        value={view}
        onChange={setView}
      />

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
