import { useMemo, useState } from 'react'
import type { Tab } from '../types'
import { getClub } from '../data/clubs'
import { getCourse } from '../data/courses'
import { getDrill } from '../data/drills'
import { generateHomeSummary, generatePracticePlan, generateTodaysFocus } from '../lib/aiCoach'
import {
  bestAndWorstClub, computeClubStats, computeWeaknesses, gappingWarnings, scoreTrend, trueSkillIndex,
} from '../lib/insights'
import { useAppState } from '../hooks/useAppState'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { FeedbackCard } from '../components/FeedbackCard'
import { Badge, Button, Card, Meter, ProgressRing, SectionTitle, StatCard } from '../components/ui'
import { fmtDate, round1 } from '../lib/utils'

export function Home({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { state } = useAppState()
  const { canInstall, installed, install } = useInstallPrompt()
  const [showPlan, setShowPlan] = useState(false)

  const stats = useMemo(() => computeClubStats(state), [state])
  const weaknesses = useMemo(() => computeWeaknesses(state), [state])
  const tsi = useMemo(() => trueSkillIndex(state), [state])
  const trend = useMemo(() => scoreTrend(state.rounds), [state.rounds])
  const { best } = useMemo(() => bestAndWorstClub(stats), [stats])
  const gapping = useMemo(() => gappingWarnings(stats), [stats])
  const plan = useMemo(() => generatePracticePlan(state.profile, weaknesses.map((w) => w.title)), [state.profile, weaknesses])

  const lastRound = [...state.rounds].filter((r) => r.status === 'complete').sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastRange = [...state.rangeSessions].filter((s) => s.status === 'complete').sort((a, b) => b.date.localeCompare(a.date))[0]
  const hcpTrend = trend.length >= 2 ? round1(state.profile.handicap - (trend[0].score - trend[trend.length - 1].score) * 0.18) : state.profile.handicap
  const confRanking = [...stats].sort((a, b) => b.confidence - a.confidence).slice(0, 5)

  return (
    <div className="animate-fade">
      {/* Hero: True Skill Index */}
      <Card glow className="flex items-center gap-5">
        <ProgressRing value={tsi} size={108} stroke={9} sub="TSI" />
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">True Skill Index</div>
          <div className="mt-1 text-[13px] text-muted leading-snug">
            Built from normalized shots, club confidence, and leak severity — not vanity distances.
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px]">
            <Badge tone="good">HCP {state.profile.handicap.toFixed(1)} → {hcpTrend.toFixed(1)}</Badge>
            <span className="text-faint text-[11px]">projected</span>
          </div>
        </div>
      </Card>

      {/* Today's focus */}
      <FeedbackCard title="Today's Focus" tone="good" className="mt-3">
        {generateTodaysFocus(state.profile, weaknesses.map((w) => w.title))}
      </FeedbackCard>

      <SectionTitle>Snapshot</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Top Leak" tone="bad"
          value={weaknesses[0]?.title ?? '—'}
          sub={`~${weaknesses[0]?.severity.toFixed(1)} strokes/round`}
        />
        <StatCard
          label="Best Opportunity" tone="gold"
          value={weaknesses[1]?.title ?? 'Consistency'}
          sub="Highest ROI practice"
        />
        <StatCard
          label="Most Reliable" tone="good"
          value={getClub(best.clubId).label}
          sub={`${best.confidence}% confidence · ${best.normalizedAvg} yds true`}
        />
        <StatCard
          label="Last Round"
          value={lastRound ? lastRound.holes.reduce((a, h) => a + h.strokes, 0) : '—'}
          sub={
            lastRound
              ? `${lastRound.holes.filter((h) => h.fairway === 'hit').length} FW · ${lastRound.holes.filter((h) => h.gir).length} GIR · ${lastRound.holes.reduce((a, h) => a + h.putts, 0)} putts`
              : 'No rounds yet'
          }
        />
      </div>

      {/* AI summary */}
      <SectionTitle>AI Caddie Summary</SectionTitle>
      <FeedbackCard>
        {generateHomeSummary(state.profile, weaknesses.map((w) => w.title), getClub(best.clubId).label)}
      </FeedbackCard>
      {gapping.length > 0 && (
        <FeedbackCard title="Gapping Warning" tone="warn" className="mt-3">
          {gapping[0]}
        </FeedbackCard>
      )}

      {/* Weaknesses */}
      <SectionTitle>Top 3 Weaknesses</SectionTitle>
      <div className="space-y-2.5">
        {weaknesses.map((w, i) => (
          <Card key={w.title}>
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${i === 0 ? 'bg-danger/15 text-danger' : 'bg-gold/15 text-gold'}`}>
                {i + 1}
              </span>
              <div>
                <div className="font-semibold text-[14px]">{w.title}</div>
                <div className="mt-0.5 text-[13px] text-muted leading-snug">{w.detail}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Practice plan */}
      <SectionTitle
        action={
          <Button size="sm" variant="ghost" onClick={() => setShowPlan(!showPlan)}>
            {showPlan ? 'Hide' : 'What should I practice next?'}
          </Button>
        }
      >
        Next Practice
      </SectionTitle>
      <Card className="border-accent/30">
        <div className="text-[14px] font-semibold">
          {plan.map((p) => getDrill(p.drillId).name.split(' ').slice(0, 3).join(' ')).join(' + ')}
        </div>
        <div className="mt-1 text-[12px] text-muted">{plan.reduce((a, p) => a + p.minutes, 0)} minutes · tuned to your top leaks</div>
        {showPlan && (
          <div className="mt-3 space-y-2 border-t border-line pt-3 animate-fade">
            {plan.map((p) => (
              <div key={p.drillId} className="text-[13px]">
                <span className="font-semibold text-accent-bright">{getDrill(p.drillId).name}</span>
                <span className="text-faint"> · {p.minutes} min</span>
                <div className="text-muted">{p.reason}</div>
              </div>
            ))}
          </div>
        )}
        <Button size="sm" className="mt-3" onClick={() => onNavigate('range')}>
          Start range session →
        </Button>
      </Card>

      {/* Club confidence */}
      <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => onNavigate('insights')}>All clubs →</Button>}>
        Club Confidence
      </SectionTitle>
      <Card>
        <div className="space-y-3">
          {confRanking.map((s) => (
            <div key={s.clubId} className="flex items-center gap-3">
              <span className="w-8 text-[13px] font-bold text-muted">{getClub(s.clubId).short}</span>
              <Meter value={s.confidence} tone="good" className="flex-1" />
              <span className="w-10 text-right text-[13px] font-semibold tabular-nums">{s.confidence}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activity */}
      <SectionTitle>Recent Activity</SectionTitle>
      <div className="space-y-2.5">
        {lastRound && (
          <Card onClick={() => onNavigate('play')}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold">{getCourse(lastRound.courseId).name}</div>
                <div className="text-[12px] text-muted">{fmtDate(lastRound.date)} · Round</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold tabular-nums">{lastRound.holes.reduce((a, h) => a + h.strokes, 0)}</div>
                <div className="text-[11px] text-faint">{lastRound.holes.length} holes</div>
              </div>
            </div>
          </Card>
        )}
        {lastRange && (
          <Card onClick={() => onNavigate('range')}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold">Range · {getDrill(lastRange.drillId).name}</div>
                <div className="text-[12px] text-muted">{fmtDate(lastRange.date)} · {lastRange.shots.length} shots</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold tabular-nums text-accent-bright">{lastRange.score}</div>
                <div className="text-[11px] text-faint">practice score</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Install PWA */}
      {!installed && (
        <Card className="mt-6 border-info/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[14px] font-semibold">Install TrueCaddie</div>
              <div className="text-[12px] text-muted">
                {canInstall ? 'Add to your home screen — works offline on the course.' : 'Use your browser\'s "Add to Home Screen" for the full app experience.'}
              </div>
            </div>
            {canInstall && (
              <Button size="sm" onClick={install}>Install</Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
