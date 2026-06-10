import { useMemo, useState } from 'react'
import type { Conditions, Contact, Lie, Line, Outcome, ShotInput, ShotShape, WindDir } from '../types'
import { getClub, orderedBag } from '../data/clubs'
import { COURSES, getCourse, getHole } from '../data/courses'
import { approachAdvice, riskLabel, teeAdvice } from '../lib/caddieEngine'
import { explainNormalization } from '../lib/aiCoach'
import { fmtDate, fmtScoreToPar } from '../lib/utils'
import { useActiveRound, useAppState } from '../hooks/useAppState'
import { ARPreview } from '../components/ARPreview'
import { FeedbackCard } from '../components/FeedbackCard'
import { Badge, Button, Card, Chip, Field, SectionTitle, Segmented, Sheet, inputClass } from '../components/ui'
import { PlayHub } from './play/PlayHub'
import { GpsRound } from './play/GpsRound'

const WIND_DIRS: { id: WindDir; label: string }[] = [
  { id: 'calm', label: 'Calm' },
  { id: 'into', label: 'Into' },
  { id: 'down', label: 'Down' },
  { id: 'cross-left', label: '← Cross' },
  { id: 'cross-right', label: 'Cross →' },
]

function defaultConditions(): Conditions {
  return { windSpeed: 8, windDir: 'into', elevationFt: 0, tempF: 72, firmness: 'normal', wet: false, slope: 'flat' }
}

export function Play() {
  const round = useActiveRound()
  if (round && round.mode === 'gps') return <GpsRound />
  return round ? <ActiveRound /> : <PlayHub />
}

// ── Lobby: pick course, see history ────────────────────────────────────

export function PlayLobby() {
  const { state, dispatch } = useAppState()
  const [conditions, setConditions] = useState<Conditions>(defaultConditions())
  const history = [...state.rounds].filter((r) => r.status === 'complete').sort((a, b) => b.date.localeCompare(a.date))
  const [openRound, setOpenRound] = useState<string | null>(null)

  return (
    <div className="animate-fade">
      <SectionTitle>Start a Round</SectionTitle>
      <div className="space-y-3">
        {COURSES.map((c) => (
          <Card key={c.id} className={c.style === 'premium' ? 'border-gold/25' : ''}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[15px]">{c.name}</span>
                  {c.style === 'premium' && <Badge tone="gold">Championship</Badge>}
                </div>
                <div className="text-[12px] text-muted mt-0.5">
                  {c.location} · {c.holes.length} holes · {c.rating} / {c.slope}
                </div>
                <div className="text-[12px] text-faint mt-1">
                  Par {c.holes.reduce((a, h) => a + h.par, 0)} · {c.holes.reduce((a, h) => a + h.yards, 0).toLocaleString()} yds
                </div>
              </div>
              <Button size="sm" onClick={() => dispatch({ type: 'START_ROUND', courseId: c.id, conditions })}>
                Play
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Today's Conditions</SectionTitle>
      <Card>
        <Field label={`Wind: ${conditions.windSpeed} mph`}>
          <input
            type="range" min={0} max={30} value={conditions.windSpeed}
            onChange={(e) => setConditions({ ...conditions, windSpeed: Number(e.target.value) })}
            className="w-full accent-[#10b981]"
          />
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          {WIND_DIRS.map((w) => (
            <Chip key={w.id} selected={conditions.windDir === w.id} onClick={() => setConditions({ ...conditions, windDir: w.id })}>
              {w.label}
            </Chip>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label={`Temp: ${conditions.tempF}°F`}>
            <input
              type="range" min={35} max={105} value={conditions.tempF}
              onChange={(e) => setConditions({ ...conditions, tempF: Number(e.target.value) })}
              className="w-full accent-[#10b981]"
            />
          </Field>
          <Field label="Turf">
            <Segmented
              options={[
                { value: 'soft', label: 'Soft' },
                { value: 'normal', label: 'Med' },
                { value: 'firm', label: 'Firm' },
              ]}
              value={conditions.firmness}
              onChange={(firmness) => setConditions({ ...conditions, firmness })}
            />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] text-muted">
          <input
            type="checkbox" checked={conditions.wet}
            onChange={(e) => setConditions({ ...conditions, wet: e.target.checked })}
            className="h-4 w-4 accent-[#10b981]"
          />
          Wet course (rain / morning dew)
        </label>
      </Card>

      <SectionTitle>Round History</SectionTitle>
      {history.length === 0 && (
        <Card className="text-center text-muted text-sm py-8">No rounds yet — tee it up above.</Card>
      )}
      <div className="space-y-2.5">
        {history.map((r) => {
          const strokes = r.holes.reduce((a, h) => a + h.strokes, 0)
          const par = r.holes.reduce((a, h) => a + h.par, 0)
          const open = openRound === r.id
          return (
            <Card key={r.id} onClick={() => setOpenRound(open ? null : r.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[14px]">{getCourse(r.courseId).name}</div>
                  <div className="text-[12px] text-muted">
                    {fmtDate(r.date)} · {r.holes.filter((h) => h.fairway === 'hit').length} FW · {r.holes.filter((h) => h.gir).length} GIR · {r.holes.reduce((a, h) => a + h.putts, 0)} putts
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold tabular-nums">{strokes}</div>
                  <div className="text-[11px] text-faint">{fmtScoreToPar(strokes, par)}</div>
                </div>
              </div>
              {open && r.recap && (
                <div className="mt-3 border-t border-line pt-3 animate-fade">
                  <FeedbackCard title="Round Recap">{r.recap}</FeedbackCard>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Active round ────────────────────────────────────────────────────────

function ActiveRound() {
  const { state, dispatch } = useAppState()
  const round = useActiveRound()!
  const [showAR, setShowAR] = useState(false)
  const [showEntry, setShowEntry] = useState(false)
  const [showHoleOut, setShowHoleOut] = useState(false)

  const course = getCourse(round.courseId)
  const hole = getHole(round.courseId, round.currentHole)
  const holeResult = round.holes.find((h) => h.holeNumber === round.currentHole)!
  const shots = holeResult.shots

  const distanceUsed = shots.reduce((a, s) => a + Math.max(s.actualDistance, 0), 0)
  const remaining = Math.max(hole.yards - distanceUsed, 25)
  const lastShot = shots[shots.length - 1]
  const nextLie: Lie =
    !lastShot ? 'tee'
    : lastShot.outcome === 'fairway' ? 'fairway'
    : lastShot.outcome === 'rough' || lastShot.outcome === 'short' || lastShot.outcome === 'long' ? 'rough'
    : lastShot.outcome === 'bunker' ? 'bunker'
    : lastShot.outcome === 'fringe' ? 'fringe'
    : ['water', 'ob'].includes(lastShot.outcome) ? 'rough'
    : 'fairway'

  const advice = useMemo(() => {
    if (shots.length === 0) return teeAdvice(hole, state.profile, state.bag, round.conditions)
    return approachAdvice(remaining, hole, state.profile, state.bag, round.conditions, nextLie === 'fringe' ? 'fairway' : nextLie as never)
  }, [shots.length, hole, state.profile, state.bag, round.conditions, remaining, nextLie])

  const played = round.holes.filter((h) => h.strokes > 0)
  const runningStrokes = played.reduce((a, h) => a + h.strokes, 0)
  const runningPar = played.reduce((a, h) => a + h.par, 0)
  const onGreen = lastShot && ['green', 'fringe', 'holed'].includes(lastShot.outcome)

  return (
    <div className="animate-fade">
      {/* Score strip */}
      <Card className="flex items-center justify-between !py-3">
        <div>
          <div className="text-[12px] text-muted">{course.name}</div>
          <div className="font-bold">
            Hole {hole.number} <span className="text-muted font-medium">of {course.holes.length}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tabular-nums">
            {runningStrokes > 0 ? `${runningStrokes} (${fmtScoreToPar(runningStrokes, runningPar)})` : 'E'}
          </div>
          <div className="text-[11px] text-faint">through {played.length}</div>
        </div>
      </Card>

      {/* Hole card */}
      <Card className="mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">Par {hole.par}</span>
            <span className="text-lg text-muted tabular-nums">{hole.yards} yds</span>
          </div>
          <Badge>HCP {hole.handicap}</Badge>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge tone="info">{hole.shape.replace('-', ' ')}</Badge>
          {hole.elevationFt !== 0 && (
            <Badge tone={hole.elevationFt > 0 ? 'gold' : 'good'}>
              {hole.elevationFt > 0 ? '▲' : '▼'} {Math.abs(hole.elevationFt)} ft
            </Badge>
          )}
          {hole.hazards.map((h, i) => (
            <Badge key={i} tone="bad">{h.type} {h.side}</Badge>
          ))}
        </div>
        <p className="mt-2.5 text-[13px] text-muted leading-snug">{hole.strategy}</p>
        <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setShowAR(true)}>
          ⌖ Open XR Caddie View
        </Button>
      </Card>

      {/* Caddie advice */}
      <FeedbackCard title={shots.length === 0 ? 'Tee Shot — AI Caddie' : `Shot ${shots.length + 1} — AI Caddie`} className="mt-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-accent-bright">
            {getClub(advice.club).label}
            {advice.altClub && <span className="text-[12px] font-medium text-faint"> · alt {getClub(advice.altClub).short}</span>}
          </div>
          <div className="text-right">
            <div className={`text-[12px] font-bold ${advice.riskLevel < 35 ? 'text-accent-bright' : advice.riskLevel < 65 ? 'text-gold' : 'text-danger'}`}>
              {riskLabel(advice.riskLevel)}
            </div>
            <div className="mt-1 h-1.5 w-24 rounded-full bg-surface-3 overflow-hidden">
              <div
                className={`h-full ${advice.riskLevel < 35 ? 'bg-accent' : advice.riskLevel < 65 ? 'bg-gold' : 'bg-danger'}`}
                style={{ width: `${advice.riskLevel}%` }}
              />
            </div>
          </div>
        </div>
        <div className="text-[13px] font-medium mt-0.5">Target: {advice.target} · plays {advice.playsLike}</div>
        <ul className="mt-2 space-y-1">
          {advice.rationale.map((r, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-muted leading-snug">
              <span className="text-accent-bright">·</span>{r}
            </li>
          ))}
        </ul>
        <div className="mt-2.5 rounded-xl bg-surface-3/60 px-3 py-2 text-[12px] text-muted">
          Aggressive line: {getClub(advice.aggressive.club).label} {advice.aggressive.target.toLowerCase()} —
          gains {advice.aggressive.gain.toFixed(1)} SG, adds {advice.aggressive.penaltyRisk.toFixed(1)} penalty risk.
        </div>
      </FeedbackCard>

      {/* Logged shots */}
      {shots.length > 0 && (
        <>
          <SectionTitle>This Hole</SectionTitle>
          <div className="space-y-2.5">
            {shots.map((s) => (
              <ShotCard key={s.id} shotNumber={s.shotNumber} clubId={s.clubId} feedback={s.feedback} outcome={s.outcome} actual={s.actualDistance} normalized={s.normalized.normalizedTotal} explain={explainNormalization(s)} />
            ))}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button size="lg" onClick={() => setShowEntry(true)}>
          + Log shot
        </Button>
        <Button size="lg" variant={onGreen ? 'primary' : 'secondary'} onClick={() => setShowHoleOut(true)}>
          Hole out
        </Button>
      </div>
      <button onClick={() => dispatch({ type: 'ABANDON_ROUND' })} className="mt-4 w-full text-center text-[12px] text-faint">
        Abandon round
      </button>

      {showAR && (
        <ARPreview hole={hole} conditions={round.conditions} advice={advice} bag={state.bag} onClose={() => setShowAR(false)} />
      )}

      <ShotEntrySheet
        open={showEntry}
        onClose={() => setShowEntry(false)}
        suggestedClub={advice.club}
        suggestedDistance={shots.length === 0 ? Math.min(advice.playsLike, state.bag.find((b) => b.clubId === advice.club)?.total ?? advice.playsLike) : remaining}
        lie={nextLie}
        baseConditions={round.conditions}
        elevation={shots.length === 0 ? hole.elevationFt : 0}
        onSave={(input) => {
          dispatch({ type: 'LOG_SHOT', input })
          setShowEntry(false)
        }}
      />

      <HoleOutSheet
        open={showHoleOut}
        onClose={() => setShowHoleOut(false)}
        strokesSoFar={shots.length + holeResult.penalties}
        par={hole.par}
        isLastHole={round.currentHole >= course.holes.length}
        onSave={(putts) => {
          dispatch({ type: 'FINISH_HOLE', putts })
          setShowHoleOut(false)
        }}
      />
    </div>
  )
}

function ShotCard({
  shotNumber, clubId, feedback, outcome, actual, normalized, explain,
}: { shotNumber: number; clubId: ShotInput['clubId']; feedback: string; outcome: Outcome; actual: number; normalized: number; explain: string[] }) {
  const [open, setOpen] = useState(false)
  const bad = ['water', 'ob'].includes(outcome)
  return (
    <Card onClick={() => setOpen(!open)} className={bad ? 'border-danger/30' : ''}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-3 text-[12px] font-bold">{shotNumber}</span>
          <div>
            <span className="font-semibold text-[14px]">{getClub(clubId).label}</span>
            <Badge tone={bad ? 'bad' : ['green', 'holed', 'fairway'].includes(outcome) ? 'good' : 'default'}>
              <span className="ml-0">{outcome}</span>
            </Badge>
          </div>
        </div>
        <div className="text-right text-[13px] tabular-nums">
          <div className="font-bold">{actual} yds</div>
          <div className="text-accent-bright text-[11px]">true {normalized}</div>
        </div>
      </div>
      <p className="mt-2 text-[13px] text-muted leading-snug">{feedback}</p>
      {open && (
        <div className="mt-2.5 space-y-1 border-t border-line pt-2.5 animate-fade">
          <div className="text-[11px] font-bold uppercase tracking-wider text-faint">Normalization breakdown</div>
          {explain.map((line, i) => (
            <div key={i} className="text-[12px] text-muted leading-snug">{line}</div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── Shot entry sheet ────────────────────────────────────────────────────

const CONTACTS: Contact[] = ['pure', 'thin', 'fat', 'toe', 'heel', 'topped', 'shank']
const SHAPES: ShotShape[] = ['straight', 'draw', 'fade', 'slice', 'hook', 'push', 'pull']
const LIES: Lie[] = ['tee', 'fairway', 'rough', 'deep-rough', 'bunker', 'fringe', 'recovery']
const OUTCOMES: Outcome[] = ['fairway', 'rough', 'bunker', 'green', 'fringe', 'short', 'long', 'water', 'ob', 'holed']

function ShotEntrySheet({
  open, onClose, suggestedClub, suggestedDistance, lie, baseConditions, elevation, onSave,
}: {
  open: boolean
  onClose: () => void
  suggestedClub: ShotInput['clubId']
  suggestedDistance: number
  lie: Lie
  baseConditions: Conditions
  elevation: number
  onSave: (input: ShotInput) => void
}) {
  const { state } = useAppState()
  const [clubId, setClubId] = useState(suggestedClub)
  const [intended, setIntended] = useState(suggestedDistance)
  const [actual, setActual] = useState(suggestedDistance)
  const [line, setLine] = useState<Line>('center')
  const [contact, setContact] = useState<Contact>('pure')
  const [shape, setShape] = useState<ShotShape>('straight')
  const [shotLie, setShotLie] = useState<Lie>(lie)
  const [outcome, setOutcome] = useState<Outcome>('fairway')
  const [windSpeed, setWindSpeed] = useState(baseConditions.windSpeed)
  const [windDir, setWindDir] = useState<WindDir>(baseConditions.windDir)
  const [elevationFt, setElevationFt] = useState(elevation)
  const [slope, setSlope] = useState<Conditions['slope']>('flat')
  const [synced, setSynced] = useState({ club: suggestedClub, dist: suggestedDistance, lie })

  // Re-sync defaults each time the sheet opens with new suggestions.
  if (open && (synced.club !== suggestedClub || synced.dist !== suggestedDistance || synced.lie !== lie)) {
    setSynced({ club: suggestedClub, dist: suggestedDistance, lie })
    setClubId(suggestedClub)
    setIntended(suggestedDistance)
    setActual(suggestedDistance)
    setShotLie(lie)
    setLine('center')
    setContact('pure')
    setShape('straight')
    setOutcome('fairway')
    setElevationFt(elevation)
    setSlope('flat')
  }

  const bag = orderedBag(state.bag).filter((b) => b.clubId !== 'PT')

  return (
    <Sheet open={open} onClose={onClose} title="Log Shot">
      <div className="space-y-4 pb-4">
        <Field label="Club">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {bag.map((b) => (
              <Chip key={b.clubId} selected={clubId === b.clubId} onClick={() => { setClubId(b.clubId); setIntended(b.total); setActual(b.total) }}>
                {getClub(b.clubId).short}
              </Chip>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Intended (yds)">
            <input type="number" className={inputClass} value={intended} onChange={(e) => setIntended(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Actual (yds)">
            <input type="number" className={inputClass} value={actual} onChange={(e) => setActual(Number(e.target.value) || 0)} />
          </Field>
        </div>

        <Field label="Direction">
          <Segmented
            options={[
              { value: 'left', label: '← Left' },
              { value: 'center', label: 'On line' },
              { value: 'right', label: 'Right →' },
            ]}
            value={line}
            onChange={setLine}
          />
        </Field>

        <Field label="Contact">
          <div className="flex flex-wrap gap-2">
            {CONTACTS.map((c) => (
              <Chip key={c} selected={contact === c} tone={c === 'pure' ? 'good' : 'default'} onClick={() => setContact(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Shape">
          <div className="flex flex-wrap gap-2">
            {SHAPES.map((s) => (
              <Chip key={s} selected={shape === s} onClick={() => setShape(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Lie (where you played from)">
          <div className="flex flex-wrap gap-2">
            {LIES.map((l) => (
              <Chip key={l} selected={shotLie === l} onClick={() => setShotLie(l)}>
                {l}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Result">
          <div className="flex flex-wrap gap-2">
            {OUTCOMES.map((o) => (
              <Chip
                key={o}
                selected={outcome === o}
                tone={['water', 'ob'].includes(o) ? 'bad' : ['green', 'holed', 'fairway'].includes(o) ? 'good' : 'default'}
                onClick={() => setOutcome(o)}
              >
                {o}
              </Chip>
            ))}
          </div>
        </Field>

        <details className="rounded-xl border border-line bg-surface-2 px-4 py-3">
          <summary className="cursor-pointer text-[13px] font-medium text-muted">
            Conditions: {windSpeed} mph {windDir}, {elevationFt >= 0 ? '+' : ''}{elevationFt} ft, {slope}
          </summary>
          <div className="mt-3 space-y-3">
            <Field label={`Wind: ${windSpeed} mph`}>
              <input type="range" min={0} max={30} value={windSpeed} onChange={(e) => setWindSpeed(Number(e.target.value))} className="w-full accent-[#10b981]" />
            </Field>
            <div className="flex flex-wrap gap-2">
              {WIND_DIRS.map((w) => (
                <Chip key={w.id} selected={windDir === w.id} onClick={() => setWindDir(w.id)}>{w.label}</Chip>
              ))}
            </div>
            <Field label={`Elevation: ${elevationFt >= 0 ? '+' : ''}${elevationFt} ft`}>
              <input type="range" min={-50} max={50} value={elevationFt} onChange={(e) => setElevationFt(Number(e.target.value))} className="w-full accent-[#10b981]" />
            </Field>
            <Field label="Stance slope">
              <div className="flex flex-wrap gap-2">
                {(['flat', 'uphill', 'downhill', 'ball-above', 'ball-below'] as const).map((s) => (
                  <Chip key={s} selected={slope === s} onClick={() => setSlope(s)}>{s}</Chip>
                ))}
              </div>
            </Field>
          </div>
        </details>

        <Button size="lg" className="w-full" onClick={() =>
          onSave({
            clubId, intendedDistance: intended, actualDistance: actual, line, contact, shape,
            lie: shotLie, outcome,
            conditions: { ...baseConditions, windSpeed, windDir, elevationFt, slope },
          })
        }>
          Save shot & get feedback
        </Button>
      </div>
    </Sheet>
  )
}

// ── Hole out sheet ──────────────────────────────────────────────────────

function HoleOutSheet({
  open, onClose, strokesSoFar, par, isLastHole, onSave,
}: { open: boolean; onClose: () => void; strokesSoFar: number; par: number; isLastHole: boolean; onSave: (putts: number) => void }) {
  const [putts, setPutts] = useState(2)
  const total = strokesSoFar + putts
  return (
    <Sheet open={open} onClose={onClose} title="Hole Out">
      <div className="space-y-4 pb-4">
        <Field label="Putts">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((p) => (
              <Chip key={p} selected={putts === p} onClick={() => setPutts(p)}>{p}</Chip>
            ))}
          </div>
        </Field>
        <Card className="text-center">
          <div className="text-[12px] uppercase tracking-wider text-faint">Hole score</div>
          <div className="text-4xl font-bold tabular-nums mt-1">{total}</div>
          <div className={`text-[13px] font-semibold ${total <= par ? 'text-accent-bright' : total === par + 1 ? 'text-gold' : 'text-danger'}`}>
            {total < par - 1 ? 'Eagle!' : total === par - 1 ? 'Birdie!' : total === par ? 'Par' : total === par + 1 ? 'Bogey' : `+${total - par}`}
          </div>
        </Card>
        <Button size="lg" className="w-full" onClick={() => onSave(putts)}>
          {isLastHole ? 'Finish round →' : 'Next hole →'}
        </Button>
      </div>
    </Sheet>
  )
}
