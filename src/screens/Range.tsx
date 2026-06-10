import { useMemo, useState } from 'react'
import type { ClubId, FeedbackTag, Line, RangeGoal, RangeShot } from '../types'
import { getClub, orderedBag } from '../data/clubs'
import { getDrill } from '../data/drills'
import { GOAL_DESCRIPTIONS, GOAL_LABELS, recommendDrills } from '../lib/drillEngine'
import { fmtDate, pct } from '../lib/utils'
import { useActiveRange, useAppState } from '../hooks/useAppState'
import { DispersionPlot } from '../components/charts'
import { DrillCard } from '../components/DrillCard'
import { FeedbackCard } from '../components/FeedbackCard'
import { Badge, Button, Card, Chip, Field, SectionTitle, Sheet, StatCard, inputClass } from '../components/ui'

const GOALS = Object.keys(GOAL_LABELS) as RangeGoal[]

export function Range() {
  const session = useActiveRange()
  return session ? <ActiveSession /> : <RangeLobby />
}

// ── Lobby / setup ───────────────────────────────────────────────────────

function RangeLobby() {
  const { state, dispatch } = useAppState()
  const [goal, setGoal] = useState<RangeGoal>(state.profile.commonMiss === 'slice' ? 'fix-slice' : 'stock-yardages')
  const [clubIds, setClubIds] = useState<ClubId[]>(['DR'])
  const [openSession, setOpenSession] = useState<string | null>(null)

  const drills = useMemo(() => recommendDrills(goal, state.profile), [goal, state.profile])
  const history = [...state.rangeSessions].filter((s) => s.status === 'complete').sort((a, b) => b.date.localeCompare(a.date))
  const bag = orderedBag(state.bag).filter((b) => b.clubId !== 'PT')

  const toggleClub = (id: ClubId) =>
    setClubIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  return (
    <div className="animate-fade">
      <SectionTitle>Session Goal</SectionTitle>
      <div className="grid grid-cols-1 gap-2">
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => setGoal(g)}
            className={`rounded-xl border px-4 py-2.5 text-left transition-all ${goal === g ? 'border-accent bg-accent/10' : 'border-line bg-surface'}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[14px] font-semibold ${goal === g ? 'text-accent-bright' : ''}`}>{GOAL_LABELS[g]}</span>
              {goal === g && <span className="text-accent-bright">●</span>}
            </div>
            <div className="text-[12px] text-muted">{GOAL_DESCRIPTIONS[g]}</div>
          </button>
        ))}
      </div>

      <SectionTitle>Clubs for this session</SectionTitle>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {bag.map((b) => (
          <Chip key={b.clubId} selected={clubIds.includes(b.clubId)} onClick={() => toggleClub(b.clubId)}>
            {getClub(b.clubId).short}
          </Chip>
        ))}
      </div>

      <SectionTitle>Recommended Drill</SectionTitle>
      <div className="space-y-2.5">
        <DrillCard drill={drills[0]} highlight reason="Best match for your goal and miss pattern." />
        <DrillCard drill={drills[1]} />
      </div>

      <Button
        size="lg"
        className="mt-5 w-full"
        disabled={clubIds.length === 0}
        onClick={() => dispatch({ type: 'START_RANGE', goal, clubIds, drillId: drills[0].id })}
      >
        Start range session →
      </Button>

      <SectionTitle>Range History</SectionTitle>
      {history.length === 0 && <Card className="text-center text-muted text-sm py-8">No sessions yet.</Card>}
      <div className="space-y-2.5">
        {history.map((s) => {
          const open = openSession === s.id
          return (
            <Card key={s.id} onClick={() => setOpenSession(open ? null : s.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[14px]">{GOAL_LABELS[s.goal]}</div>
                  <div className="text-[12px] text-muted">
                    {fmtDate(s.date)} · {getDrill(s.drillId).name} · {s.shots.length} shots
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold tabular-nums text-accent-bright">{s.score}</div>
                  <div className="text-[11px] text-faint">score</div>
                </div>
              </div>
              {open && (
                <div className="mt-3 border-t border-line pt-3 space-y-3 animate-fade">
                  <DispersionPlot shots={s.shots} />
                  {s.summary && <FeedbackCard title="Session Summary">{s.summary}</FeedbackCard>}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Active session ──────────────────────────────────────────────────────

const QUICK_TAGS: { tag: FeedbackTag; tone: 'good' | 'bad' | 'warn' }[] = [
  { tag: 'great', tone: 'good' }, { tag: 'good', tone: 'good' }, { tag: 'straight', tone: 'good' },
  { tag: 'slice', tone: 'bad' }, { tag: 'hook', tone: 'bad' }, { tag: 'push', tone: 'warn' }, { tag: 'pull', tone: 'warn' },
  { tag: 'fat', tone: 'bad' }, { tag: 'thin', tone: 'bad' }, { tag: 'topped', tone: 'bad' }, { tag: 'bladed', tone: 'bad' },
  { tag: 'duffed', tone: 'bad' }, { tag: 'shanked', tone: 'bad' }, { tag: 'toe', tone: 'warn' }, { tag: 'heel', tone: 'warn' },
  { tag: 'too-hard', tone: 'warn' }, { tag: 'too-soft', tone: 'warn' }, { tag: 'short', tone: 'warn' }, { tag: 'long', tone: 'warn' },
  { tag: 'bad-contact', tone: 'bad' }, { tag: 'wrong-club', tone: 'warn' }, { tag: 'bad-alignment', tone: 'warn' }, { tag: 'bad-tempo', tone: 'warn' },
]

function ActiveSession() {
  const { state, dispatch } = useAppState()
  const session = useActiveRange()!
  const drill = getDrill(session.drillId)
  const [clubId, setClubId] = useState<ClubId>(session.clubIds[0])
  const [depth, setDepth] = useState<RangeShot['depth']>('on')
  const [line, setLine] = useState<Line>('center')
  const [tags, setTags] = useState<FeedbackTag[]>([])
  const [carry, setCarry] = useState<number>(state.bag.find((b) => b.clubId === session.clubIds[0])?.carry ?? 150)
  const [showEnd, setShowEnd] = useState(false)
  const [showDrill, setShowDrill] = useState(false)

  const shots = session.shots
  const lastShot = shots[shots.length - 1]
  const goodCount = shots.filter((s) => s.depth === 'on' && s.line === 'center' && s.tags.some((t) => ['good', 'great', 'straight', 'center'].includes(t))).length
  const liveScore = shots.length ? Math.round((goodCount / shots.length) * 100) : 0

  const toggleTag = (t: FeedbackTag) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(-3)))

  const logShot = () => {
    dispatch({
      type: 'LOG_RANGE_SHOT',
      shot: { clubId, depth, line, tags: tags.length ? tags : depth === 'on' && line === 'center' ? ['good'] : [], carry },
    })
    // optimistic reset for the next rep — keep club & carry
    setDepth('on')
    setLine('center')
    setTags([])
  }

  return (
    <div className="animate-fade">
      {/* Session header */}
      <Card className="flex items-center justify-between !py-3">
        <div>
          <div className="text-[12px] text-muted">{GOAL_LABELS[session.goal]}</div>
          <button onClick={() => setShowDrill(true)} className="font-bold text-left">
            {drill.name} <span className="text-accent-bright text-[12px] font-medium">protocol →</span>
          </button>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tabular-nums text-accent-bright">{shots.length}</div>
          <div className="text-[11px] text-faint">shots</div>
        </div>
      </Card>

      {/* Last shot feedback */}
      {lastShot ? (
        <FeedbackCard title={`Rep ${lastShot.n} — Coach`} className="mt-3" tone={lastShot.depth === 'on' && lastShot.line === 'center' ? 'good' : 'default'}>
          {lastShot.feedback}
        </FeedbackCard>
      ) : (
        <FeedbackCard title="Coach" className="mt-3">
          {drill.cue} Log every ball — honest reps build the model.
        </FeedbackCard>
      )}

      {/* Entry: club + carry */}
      <SectionTitle>Log Rep {shots.length + 1}</SectionTitle>
      <Card>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {session.clubIds.map((id) => (
            <Chip
              key={id}
              selected={clubId === id}
              onClick={() => {
                setClubId(id)
                setCarry(state.bag.find((b) => b.clubId === id)?.carry ?? 150)
              }}
            >
              {getClub(id).label}
            </Chip>
          ))}
        </div>

        {/* 3×3 landing grid */}
        <div className="mt-3">
          <div className="text-[12px] font-medium text-muted mb-1.5">Where did it finish?</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['long', 'on', 'short'] as const).map((d) =>
              (['left', 'center', 'right'] as const).map((l) => {
                const active = depth === d && line === l
                const isTarget = d === 'on' && l === 'center'
                return (
                  <button
                    key={`${d}-${l}`}
                    onClick={() => {
                      setDepth(d)
                      setLine(l)
                    }}
                    className={`rounded-xl border py-3 text-[12px] font-medium transition-all active:scale-95 ${
                      active
                        ? isTarget
                          ? 'border-accent bg-accent text-[#04130d] font-bold'
                          : 'border-gold bg-gold/20 text-gold font-bold'
                        : isTarget
                          ? 'border-accent/40 bg-accent/5 text-accent-bright'
                          : 'border-line bg-surface-2 text-muted'
                    }`}
                  >
                    {isTarget ? '◎ target' : `${d === 'on' ? '' : d} ${l === 'center' ? '' : l}`.trim() || 'on line'}
                  </button>
                )
              }),
            )}
          </div>
        </div>

        {/* Quick tags */}
        <div className="mt-3">
          <div className="text-[12px] font-medium text-muted mb-1.5">Tap what happened (up to 3)</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map(({ tag, tone }) => (
              <Chip key={tag} selected={tags.includes(tag)} tone={tone} onClick={() => toggleTag(tag)} className="!px-2.5 !py-1 !text-[12px]">
                {tag.replace('-', ' ')}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Field label="Carry (yds)">
            <input type="number" className={`${inputClass} !w-24`} value={carry} onChange={(e) => setCarry(Number(e.target.value) || 0)} />
          </Field>
          <Button size="lg" className="flex-1 mt-5" onClick={logShot}>
            Log rep →
          </Button>
        </div>
      </Card>

      {/* Live stats */}
      {shots.length > 0 && (
        <>
          <SectionTitle>Live Session Data</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            <StatCard label="Quality" value={`${pct(goodCount, shots.length)}%`} tone="good" className="!p-3" />
            <StatCard label="Score" value={liveScore} tone={liveScore >= 50 ? 'good' : 'gold'} className="!p-3" />
            <StatCard
              label="Pattern"
              value={dominantPattern(shots)}
              className="!p-3 [&>div:nth-child(2)]:!text-[15px]"
            />
          </div>
          <Card className="mt-3">
            <div className="text-[12px] font-medium text-muted mb-2">Dispersion (latest highlighted)</div>
            <DispersionPlot shots={shots} />
          </Card>
        </>
      )}

      <Button size="lg" variant="secondary" className="mt-4 w-full" onClick={() => setShowEnd(true)}>
        End session
      </Button>

      {/* Drill protocol sheet */}
      <Sheet open={showDrill} onClose={() => setShowDrill(false)} title="Drill Protocol">
        <div className="pb-4">
          <DrillCard drill={drill} highlight />
        </div>
      </Sheet>

      {/* End session sheet */}
      <Sheet open={showEnd} onClose={() => setShowEnd(false)} title="End Session?">
        <div className="space-y-4 pb-4">
          <p className="text-[14px] text-muted">
            {shots.length} shots logged. The coach will score the session and write your summary.
          </p>
          <Button size="lg" className="w-full" onClick={() => { dispatch({ type: 'END_RANGE' }); setShowEnd(false) }}>
            Finish & get summary
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function dominantPattern(shots: RangeShot[]): string {
  const counts = new Map<string, number>()
  for (const s of shots) {
    if (s.depth === 'on' && s.line === 'center') continue
    const key = `${s.depth === 'on' ? '' : s.depth}-${s.line === 'center' ? '' : s.line}`.replace(/^-|-$/g, '')
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let best = 'on target'
  let bestN = 0
  counts.forEach((n, k) => {
    if (n > bestN) {
      bestN = n
      best = k
    }
  })
  return best
}
