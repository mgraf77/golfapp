import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import type { ClubId, Conditions, Lie, Outcome, ShotInput } from '../../types'
import type { GeoCourse, GeoHole, LatLng, TrackedShotStart, WeatherSnapshot } from '../../types/geo'
import { getClub, orderedBag } from '../../data/clubs'
import { adviseGeoShot, dispersionPreview, type GeoAdvice } from '../../lib/caddieGeo'
import { bearing, compassLabel, distYds, watchPosition, type GpsFix } from '../../lib/geo'
import { courseStore } from '../../lib/idb'
import { computeClubStats } from '../../lib/insights'
import { mapLie } from '../../lib/strokesGained'
import { fetchWeather } from '../../lib/weather'
import { speak, setVoiceEnabled, voiceAvailable, voiceEnabled } from '../../lib/voice'
import { useActiveRound, useAppState } from '../../hooks/useAppState'
import { ARCaddie } from '../../components/ARCaddie'
import { GreenReader } from '../../components/GreenReader'
import { Badge, Button, Card, Chip, Sheet } from '../../components/ui'

// Leaflet is browser-only and heavy — split it out of the main bundle.
const CourseMap = lazy(() =>
  import('../../components/CourseMap').then((m) => ({ default: m.CourseMap })),
)

/**
 * Live GPS round: satellite hole map, tap-to-target distances, wind-aware
 * plays-like numbers, EV-optimized caddie advice, and walk-it-off shot
 * tracking that feeds true strokes-gained.
 */

export function GpsRound() {
  const { state, dispatch } = useAppState()
  const round = useActiveRound()!
  const [course, setCourse] = useState<GeoCourse | null | 'missing'>(null)
  const [fix, setFix] = useState<GpsFix | null>(null)
  const [gpsMsg, setGpsMsg] = useState<string | null>('Acquiring GPS…')
  const [weather, setWeather] = useState<WeatherSnapshot | null>(round.weather ?? null)
  const [pin, setPin] = useState<LatLng | null>(null)
  const [target, setTarget] = useState<LatLng | null>(null)
  const [club, setClub] = useState<ClubId | null>(null)
  const [lie, setLie] = useState<string>('tee')
  const [tracking, setTracking] = useState<TrackedShotStart | null>(null)
  const [manualStrokes, setManualStrokes] = useState(4)
  const [sheet, setSheet] = useState<'none' | 'score' | 'ar' | 'caddie' | 'green'>('none')
  const [voice, setVoice] = useState(voiceEnabled())

  // course file
  useEffect(() => {
    courseStore.get(round.geoCourseId ?? '').then((c) => setCourse(c ?? 'missing'))
  }, [round.geoCourseId])

  // GPS watch
  useEffect(() => {
    return watchPosition(
      (f) => {
        setFix(f)
        setGpsMsg(null)
      },
      (msg) => setGpsMsg(msg),
    )
  }, [])

  // weather refresh every 15 min
  useEffect(() => {
    if (!course || course === 'missing') return
    const tick = () => fetchWeather(course.center).then(setWeather).catch(() => {})
    const id = setInterval(tick, 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [course])

  const hole = course && course !== 'missing'
    ? course.holes.find((h) => h.number === round.currentHole) ?? course.holes[0]
    : null

  // reset per-hole state
  const holeKey = hole?.number
  useEffect(() => {
    if (!hole) return
    setPin(hole.greenCenter)
    setTarget(null)
    setClub(null)
    setLie('tee')
    setTracking(null)
    setManualStrokes(hole.par)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holeKey])

  const stats = useMemo(() => computeClubStats(state), [state])
  const pos: LatLng | null = fix ?? hole?.tee ?? null
  const posKey = pos ? `${pos.lat.toFixed(4)},${pos.lng.toFixed(4)}` : ''

  const advice: GeoAdvice | null = useMemo(() => {
    if (!hole || !pos || !pin) return null
    return adviseGeoShot(pos, hole, pin, state.bag, stats, weather, state.profile, lie)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holeKey, posKey, pin, lie, weather, state.bag, state.profile])

  if (course === null) return <Card className="animate-rise text-sm text-muted">Opening course…</Card>
  if (course === 'missing' || !hole) {
    return (
      <Card className="animate-rise">
        <div className="font-semibold mb-1">Course file missing</div>
        <p className="text-sm text-muted mb-3">This round&apos;s downloaded course was removed from your device.</p>
        <Button variant="danger" onClick={() => dispatch({ type: 'ABANDON_ROUND' })}>End round</Button>
      </Card>
    )
  }

  const activeClubId = club ?? advice?.best.clubId ?? 'DR'
  const holeResult = round.holes.find((h) => h.holeNumber === hole.number)
  const shotsTaken = holeResult?.shots.length ?? 0
  const distFCB = pos
    ? {
        f: Math.round(distYds(pos, hole.greenFront)),
        c: Math.round(distYds(pos, hole.greenCenter)),
        b: Math.round(distYds(pos, hole.greenBack)),
      }
    : null

  const ellipse =
    pos && advice
      ? {
          center: target ?? advice.best.aim,
          ...dispersionPreview(activeClubId, state.bag, stats, state.profile),
          bearing: bearing(pos, target ?? advice.best.aim),
        }
      : null

  const holeIdx = course.holes.findIndex((h) => h.number === hole.number)
  const goHole = (delta: number) => {
    const next = course.holes[holeIdx + delta]
    if (next) dispatch({ type: 'GO_TO_HOLE', holeNumber: next.number })
  }

  // auto-advance suggestion
  const nextHole = course.holes[holeIdx + 1]
  const suggestNext =
    fix && nextHole && shotsTaken > 0 && (holeResult?.strokes ?? 0) === 0 &&
    distYds(fix, nextHole.tee) < 35 && distYds(fix, hole.greenCenter) > 80

  function startTracking() {
    if (!pos) return
    setTracking({
      clubId: activeClubId,
      start: pos,
      distToPinStart: pin ? Math.round(distYds(pos, pin)) : 0,
      lie,
      ts: Date.now(),
    })
  }

  function logTrackedShot(outcome: Outcome, endLie: string | null) {
    if (!tracking || !pin) return
    const end = fix ?? target ?? pin
    const gpsYards = Math.round(distYds(tracking.start, end))
    const sgBeforeLie = shotsTaken === 0 && hole!.par >= 4 ? 'tee' : mapLie(tracking.lie)
    const input: ShotInput = {
      clubId: tracking.clubId as ClubId,
      intendedDistance: Math.min(tracking.distToPinStart, getClub(tracking.clubId as ClubId).defaultTotal + 30) || gpsYards,
      actualDistance: gpsYards,
      line: 'center',
      contact: 'pure',
      shape: 'straight',
      lie: (tracking.lie === 'tee' ? 'tee' : tracking.lie) as Lie,
      conditions: conditionsFrom(weather),
      outcome,
    }
    dispatch({
      type: 'LOG_SHOT',
      input,
      gps: {
        start: tracking.start,
        end,
        gpsYards,
        sgBefore: { lie: sgBeforeLie, dist: tracking.distToPinStart },
        sgAfter:
          outcome === 'holed' || outcome === 'water' || outcome === 'ob'
            ? undefined
            : { lie: mapLie(endLie ?? 'fairway'), dist: Math.round(distYds(end, pin)) },
      },
    })
    setTracking(null)
    setTarget(null)
    setClub(null)
    if (endLie) setLie(endLie)
    setSheet('none')
  }

  const walked = tracking && fix ? Math.round(distYds(tracking.start, fix)) : 0

  // voice caddie: announce the plan once per hole when enabled
  const spokenRef = useRef<number | null>(null)
  useEffect(() => {
    if (!voice || !advice || !hole) return
    if (spokenRef.current === hole.number) return
    spokenRef.current = hole.number
    speak(
      `Hole ${hole.number}, par ${hole.par}. ${getClub(advice.best.clubId).label}, ${advice.best.label}. Plays ${advice.playsLike.playsLike}.`,
    )
  }, [voice, advice, hole])

  function toggleVoice() {
    const next = !voice
    setVoice(next)
    setVoiceEnabled(next)
    if (next && advice && hole) {
      spokenRef.current = hole.number
      speak(`Voice caddie on. ${getClub(advice.best.clubId).label}, ${advice.best.label}. Plays ${advice.playsLike.playsLike}.`, { force: true })
    }
  }

  function saveHole(putts: number) {
    dispatch({
      type: 'FINISH_HOLE',
      putts,
      strokesOverride: shotsTaken === 0 ? manualStrokes : undefined,
    })
  }

  return (
    <div className="animate-rise -mt-1">
      {/* hole header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => goHole(-1)} disabled={holeIdx === 0} className="px-3 py-1.5 text-xl text-muted disabled:opacity-25">‹</button>
        <div className="text-center">
          <div className="text-lg font-bold leading-tight">Hole {hole.number}</div>
          <div className="text-xs text-muted">
            Par {hole.par} · {hole.yards} yds · HCP {hole.handicap}
            {hole.estimated && ' (est.)'}
          </div>
        </div>
        <button onClick={() => goHole(1)} disabled={holeIdx >= course.holes.length - 1} className="px-3 py-1.5 text-xl text-muted disabled:opacity-25">›</button>
      </div>

      {suggestNext && (
        <Card glow className="mb-2 !py-2.5 flex items-center justify-between" onClick={() => goHole(1)}>
          <span className="text-sm">📍 You&apos;re at hole {nextHole.number} tee</span>
          <span className="text-accent-bright text-sm font-semibold">Switch →</span>
        </Card>
      )}

      {/* map */}
      <div className="relative rounded-2xl overflow-hidden border border-line">
        <Suspense fallback={<div className="h-[44dvh] min-h-[300px] w-full bg-surface flex items-center justify-center text-sm text-muted">Loading satellite view…</div>}>
          <CourseMap
            hole={hole}
            pin={pin ?? hole.greenCenter}
            onPinChange={setPin}
            target={target}
            onTargetChange={setTarget}
            fix={fix}
            ellipse={ellipse}
            aim={advice?.best.aim ?? null}
            className="h-[44dvh] min-h-[300px] w-full"
          />
        </Suspense>
        {/* wind + weather overlay */}
        {weather && (
          <div className="absolute top-2 right-2 z-[500] rounded-xl bg-bg/80 backdrop-blur px-2.5 py-1.5 border border-line flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-info compass-needle" style={{ transform: `rotate(${weather.windFromDeg + 180}deg)` }} fill="currentColor">
              <path d="M12 2 L16 14 L12 11.5 L8 14 Z" />
            </svg>
            <div className="text-[11px] leading-tight">
              <div className="font-bold text-ink">{weather.windMph} mph</div>
              <div className="text-muted">{compassLabel(weather.windFromDeg)} · {weather.tempF}°</div>
            </div>
          </div>
        )}
        {gpsMsg && (
          <div className="absolute bottom-2 left-2 right-2 z-[500] rounded-lg bg-bg/85 px-3 py-1.5 text-[11px] text-gold border border-gold/30">
            {gpsMsg} — distances measured from the tee until GPS locks.
          </div>
        )}
        {target && (
          <button
            onClick={() => setTarget(null)}
            className="absolute top-2 left-2 z-[500] rounded-lg bg-bg/80 px-2.5 py-1.5 text-[11px] text-muted border border-line"
          >
            Clear target
          </button>
        )}
      </div>

      {/* distances */}
      {distFCB && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {([['Front', distFCB.f], ['Center', distFCB.c], ['Back', distFCB.b]] as const).map(([label, v]) => (
            <div key={label} className="rounded-xl bg-surface border border-line py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
              <div className={`text-xl font-bold tabular-nums ${label === 'Center' ? 'text-accent-bright' : ''}`}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* caddie */}
      {advice && (
        <Card glow className="mt-2.5" onClick={() => setSheet('caddie')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-11 w-11 rounded-xl bg-accent text-[#04130d] flex items-center justify-center font-extrabold">
                {getClub(advice.best.clubId).short}
              </div>
              <div>
                <div className="font-semibold text-sm leading-tight">{advice.best.label}</div>
                <div className="text-xs text-muted mt-0.5">
                  Plays {advice.playsLike.playsLike}
                  {advice.best.onGreenPct != null && advice.kind !== 'tee' ? ` · ${advice.best.onGreenPct}% green` : ''}
                  {` · ${advice.best.troublePct}% trouble`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {voiceAvailable() && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVoice() }}
                  aria-label="Voice caddie"
                  className={`h-8 w-8 rounded-lg border flex items-center justify-center text-sm ${voice ? 'bg-accent text-[#04130d] border-accent' : 'bg-surface-2 border-line text-muted'}`}
                >
                  {voice ? '🔊' : '🔇'}
                </button>
              )}
              <Badge tone={advice.riskLevel < 30 ? 'good' : advice.riskLevel < 60 ? 'gold' : 'bad'}>
                {advice.riskLevel < 30 ? 'Green light' : advice.riskLevel < 60 ? 'Managed' : 'Danger'}
              </Badge>
            </div>
          </div>
          <p className="text-[13px] text-muted mt-2 leading-relaxed">{advice.rationale[advice.rationale.length > 1 ? 1 : 0] ?? ''} <span className="text-accent-bright">Tap for full read →</span></p>
        </Card>
      )}

      {/* club row */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2.5 -mx-1 px-1">
        {orderedBag(state.bag).filter((b) => b.clubId !== 'PT').map((b) => (
          <Chip key={b.clubId} selected={activeClubId === b.clubId} onClick={() => setClub(b.clubId)}>
            {getClub(b.clubId).short}
          </Chip>
        ))}
      </div>

      {/* tracking / actions */}
      {!tracking ? (
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 mt-2.5">
          <Button size="lg" onClick={startTracking} disabled={!pos}>
            🎯 Track {getClub(activeClubId).short}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setSheet('ar')}>AR</Button>
          <Button size="lg" variant="secondary" onClick={() => setSheet('green')}>🟢</Button>
          <Button size="lg" variant="secondary" onClick={() => setSheet('score')}>Card</Button>
        </div>
      ) : (
        <Card className="mt-2.5 border-gold/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">Tracking {getClub(tracking.clubId as ClubId).label}</div>
              <div className="text-xs text-muted mt-0.5">
                {fix ? `Walked ${walked} yds — at your ball, tap where it ended up` : 'Walk to your ball, then tap where it ended up'}
              </div>
            </div>
            <button onClick={() => setTracking(null)} className="text-faint text-xs px-2">Cancel</button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {([
              ['Fairway', 'fairway', 'fairway'],
              ['Green 🎯', 'green', 'green'],
              ['Rough', 'rough', 'rough'],
              ['Bunker', 'bunker', 'bunker'],
              ['Fringe', 'fringe', 'fringe'],
              ['Deep 🌲', 'rough', 'deep-rough'],
              ['Water +1', 'water', null],
              ['OB +1', 'ob', null],
              ['Holed! 🕳', 'holed', null],
            ] as [string, Outcome, string | null][]).map(([label, outcome, endLie]) => (
              <button
                key={label}
                onClick={() => logTrackedShot(outcome, endLie)}
                className={`rounded-xl border py-2.5 text-[13px] font-semibold active:scale-95 transition-transform ${
                  outcome === 'holed' ? 'bg-accent text-[#04130d] border-accent' :
                  outcome === 'water' || outcome === 'ob' ? 'bg-surface-2 border-danger/40 text-danger' :
                  'bg-surface-2 border-line text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* one-tap hole finish */}
      <Card className="mt-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">
            {shotsTaken > 0
              ? `${shotsTaken} shot${shotsTaken === 1 ? '' : 's'}${(holeResult?.penalties ?? 0) > 0 ? ` +${holeResult!.penalties} pen` : ''} — tap putts to save`
              : 'Quick score — strokes, then tap putts to save'}
          </div>
          {holeIdx >= course.holes.length - 1 && <Badge tone="gold">Final hole</Badge>}
        </div>
        {shotsTaken === 0 && (
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm text-muted">Total strokes</span>
            <div className="flex items-center gap-2.5">
              <button onClick={() => setManualStrokes(Math.max(1, manualStrokes - 1))} className="h-10 w-10 rounded-lg bg-surface-2 border border-line text-lg">−</button>
              <span className="w-8 text-center text-lg font-bold tabular-nums">{manualStrokes}</span>
              <button onClick={() => setManualStrokes(manualStrokes + 1)} className="h-10 w-10 rounded-lg bg-surface-2 border border-line text-lg">+</button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-6 gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              onClick={() => saveHole(p)}
              className={`rounded-xl border py-3 font-bold tabular-nums active:scale-95 transition-transform ${p === 2 ? 'bg-accent/15 border-accent/50 text-accent-bright' : 'bg-surface-2 border-line text-ink'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-faint mt-1.5 text-center">
          putts — saves hole {hole.number} ({shotsTaken === 0 ? `${manualStrokes} total` : `${shotsTaken + (holeResult?.penalties ?? 0)} + putts`}) and moves on
        </div>
      </Card>

      <div className="mt-3 text-center">
        <button onClick={() => dispatch({ type: 'END_ROUND' })} className="text-[12px] text-muted underline underline-offset-4">
          End round now
        </button>
        <span className="text-faint mx-2">·</span>
        <button onClick={() => dispatch({ type: 'ABANDON_ROUND' })} className="text-[12px] text-danger/80 underline underline-offset-4">
          Discard
        </button>
      </div>

      {/* ── sheets ── */}
      <GreenReader open={sheet === 'green'} onClose={() => setSheet('none')} />

      <Sheet open={sheet === 'caddie'} onClose={() => setSheet('none')} title="Caddie read">
        {advice && <CaddieDetail advice={advice} />}
      </Sheet>

      <Sheet open={sheet === 'score'} onClose={() => setSheet('none')} title={round.courseName ?? 'Scorecard'}>
        <ScorecardTable round={round} />
      </Sheet>

      {sheet === 'ar' && pos && pin && (
        <ARCaddie
          onClose={() => setSheet('none')}
          targetBearing={bearing(pos, pin)}
          distances={distFCB ?? { f: 0, c: 0, b: 0 }}
          clubShort={getClub(activeClubId).short}
          playsLike={advice?.playsLike.playsLike ?? distFCB?.c ?? 0}
        />
      )}
    </div>
  )
}

function CaddieDetail({ advice }: { advice: GeoAdvice }) {
  return (
    <div className="pb-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-accent text-[#04130d] flex items-center justify-center font-extrabold text-lg">
          {getClub(advice.best.clubId).short}
        </div>
        <div>
          <div className="font-semibold">{advice.best.label}</div>
          <div className="text-xs text-muted">{advice.best.note} · EV {advice.best.ev.toFixed(2)}</div>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {advice.rationale.map((r, i) => (
          <li key={i} className="text-sm text-muted leading-relaxed flex gap-2">
            <span className="text-accent-bright">›</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      {(advice.aggressive || advice.safe) && (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {advice.aggressive && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 px-3.5 py-2.5">
              <div className="text-[11px] uppercase tracking-wider text-gold font-semibold">Aggressive</div>
              <div className="text-sm mt-0.5">
                {getClub(advice.aggressive.clubId).label} — {advice.aggressive.label.toLowerCase()} ·{' '}
                <span className="text-muted">costs {Math.max(0, advice.aggressive.ev - advice.best.ev).toFixed(2)} EV, {advice.aggressive.troublePct}% trouble</span>
              </div>
            </div>
          )}
          {advice.safe && (
            <div className="rounded-xl border border-info/30 bg-info/5 px-3.5 py-2.5">
              <div className="text-[11px] uppercase tracking-wider text-info font-semibold">Protect the card</div>
              <div className="text-sm mt-0.5">
                {getClub(advice.safe.clubId).label} — {advice.safe.label.toLowerCase()} ·{' '}
                <span className="text-muted">{advice.safe.troublePct}% trouble</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ScorecardTable({ round }: { round: import('../../types').Round }) {
  const meta = round.holeMeta
  const par = (n: number) => meta?.find((m) => m.number === n)?.par ?? round.holes.find((h) => h.holeNumber === n)?.par ?? 4
  const played = round.holes.filter((h) => h.strokes > 0)
  const total = played.reduce((s, h) => s + h.strokes, 0)
  const totalPar = played.reduce((s, h) => s + par(h.holeNumber), 0)
  const diff = total - totalPar
  const half = Math.ceil(round.holes.length / 2)
  const rows = [round.holes.slice(0, half), round.holes.slice(half)].filter((r) => r.length)
  return (
    <div className="pb-2">
      <div className="text-center mb-3">
        <span className="text-3xl font-extrabold tabular-nums">{total || '—'}</span>
        {played.length > 0 && (
          <span className={`ml-2 text-lg font-bold ${diff <= 0 ? 'text-accent-bright' : 'text-gold'}`}>
            {diff === 0 ? 'E' : diff > 0 ? `+${diff}` : diff} thru {played.length}
          </span>
        )}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="mb-3 overflow-x-auto no-scrollbar">
          <table className="w-full text-center text-[12px]">
            <tbody>
              <tr className="text-faint">
                {row.map((h) => <td key={h.holeNumber} className="py-1 px-1 font-medium">{h.holeNumber}</td>)}
              </tr>
              <tr className="text-muted">
                {row.map((h) => <td key={h.holeNumber} className="py-0.5">{par(h.holeNumber)}</td>)}
              </tr>
              <tr>
                {row.map((h) => {
                  const d = h.strokes - par(h.holeNumber)
                  return (
                    <td key={h.holeNumber} className="py-1">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-bold tabular-nums ${
                          !h.strokes ? 'text-faint' :
                          d < 0 ? 'bg-accent/20 text-accent-bright' :
                          d === 0 ? 'text-ink' :
                          d === 1 ? 'bg-gold/15 text-gold' : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {h.strokes || '·'}
                      </span>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function conditionsFrom(w: WeatherSnapshot | null): Conditions {
  return {
    windSpeed: w?.windMph ?? 0,
    windDir: 'calm',
    elevationFt: 0,
    tempF: w?.tempF ?? 72,
    firmness: 'normal',
    wet: (w?.precipMmHr ?? 0) > 0.2,
    slope: 'flat',
  }
}
