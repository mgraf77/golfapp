import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import type { GeoCourse, WeatherSnapshot } from '../../types/geo'
import { getClub } from '../../data/clubs'
import { adviseGeoShot, dispersionPreview } from '../../lib/caddieGeo'
import { bearing, distYds } from '../../lib/geo'
import { computeClubStats } from '../../lib/insights'
import { fetchWeather } from '../../lib/weather'
import { useAppState } from '../../hooks/useAppState'
import { Badge, Button, Card } from '../../components/ui'

const CourseMap = lazy(() => import('../../components/CourseMap').then((m) => ({ default: m.CourseMap })))

/**
 * Strategy flyover: walk every hole before you play it. For each hole the
 * caddie pre-computes the tee plan and the expected approach against the
 * real geometry — so you stand on the first tee already knowing where
 * the round is won and lost.
 */

export function RoundPreview({ course, onBack, onStart }: { course: GeoCourse; onBack: () => void; onStart: () => void }) {
  const { state } = useAppState()
  const [idx, setIdx] = useState(0)
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)

  useEffect(() => {
    fetchWeather(course.center).then(setWeather).catch(() => {})
  }, [course])

  const stats = useMemo(() => computeClubStats(state), [state])
  const hole = course.holes[idx]

  const plan = useMemo(() => {
    const tee = adviseGeoShot(hole.tee, hole, hole.greenCenter, state.bag, stats, weather, state.profile, 'tee')
    let approach = null
    if (tee.kind === 'tee') {
      const rem = distYds(tee.best.aim, hole.greenCenter)
      if (rem > 25) {
        approach = adviseGeoShot(tee.best.aim, hole, hole.greenCenter, state.bag, stats, weather, state.profile, 'fairway')
      }
    }
    return { tee, approach }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hole, weather, state.bag, state.profile])

  const ellipse = {
    center: plan.tee.best.aim,
    ...dispersionPreview(plan.tee.best.clubId, state.bag, stats, state.profile),
    bearing: bearing(hole.tee, plan.tee.best.aim),
  }

  const danger = hole.hazards.filter((h) => h.type === 'water').length
  const sand = hole.hazards.filter((h) => h.type === 'bunker').length

  return (
    <div className="animate-rise">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-sm text-muted px-1 py-1">← Courses</button>
        <div className="text-sm font-semibold truncate px-2">{course.name}</div>
        <Button size="sm" onClick={onStart}>Play now</Button>
      </div>

      {/* hole pager */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} className="px-3 py-1.5 text-xl text-muted disabled:opacity-25">‹</button>
        <div className="text-center">
          <div className="text-lg font-bold leading-tight">Hole {hole.number}</div>
          <div className="text-xs text-muted">Par {hole.par} · {hole.yards} yds · HCP {hole.handicap}</div>
        </div>
        <button onClick={() => setIdx(Math.min(course.holes.length - 1, idx + 1))} disabled={idx >= course.holes.length - 1} className="px-3 py-1.5 text-xl text-muted disabled:opacity-25">›</button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-line">
        <Suspense fallback={<div className="h-[38dvh] min-h-[260px] bg-surface flex items-center justify-center text-sm text-muted">Loading satellite view…</div>}>
          <CourseMap
            hole={hole}
            pin={hole.greenCenter}
            ellipse={ellipse}
            aim={plan.tee.best.aim}
            className="h-[38dvh] min-h-[260px] w-full"
          />
        </Suspense>
      </div>

      {/* the plan */}
      <Card glow className="mt-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] uppercase tracking-wider text-accent-bright font-semibold">Game plan</span>
          <Badge tone={plan.tee.riskLevel < 30 ? 'good' : plan.tee.riskLevel < 60 ? 'gold' : 'bad'}>
            {danger > 0 ? `${danger} water` : sand > 0 ? `${sand} bunkers` : 'open'}
          </Badge>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-accent text-[#04130d] flex items-center justify-center font-extrabold shrink-0">
            {getClub(plan.tee.best.clubId).short}
          </div>
          <div className="text-sm leading-snug">
            <span className="font-semibold">{plan.tee.best.label}.</span>{' '}
            <span className="text-muted">{plan.tee.rationale[plan.tee.rationale.length - 1]}</span>
          </div>
        </div>
        {plan.approach && (
          <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-line/60">
            <div className="h-10 w-10 rounded-xl bg-surface-3 text-ink flex items-center justify-center font-extrabold shrink-0">
              {getClub(plan.approach.best.clubId).short}
            </div>
            <div className="text-sm leading-snug">
              <span className="font-semibold">Then {plan.approach.best.label.toLowerCase()}</span>{' '}
              <span className="text-muted">
                (~{plan.approach.playsLike.actual} in{plan.approach.best.onGreenPct != null ? `, ${plan.approach.best.onGreenPct}% green` : ''}).
              </span>
            </div>
          </div>
        )}
        <p className="text-[12px] text-faint mt-2.5">
          Expected score: <span className="text-ink font-semibold">{(plan.tee.best.ev + (hole.par >= 4 ? 0 : 0)).toFixed(1)}</span>
          {weather ? ` · wind ${weather.windMph} mph factored in` : ' · calm-air numbers'}
        </p>
      </Card>

      {/* hole strip */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3 -mx-1 px-1 pb-1">
        {course.holes.map((h, i) => (
          <button
            key={h.number}
            onClick={() => setIdx(i)}
            className={`shrink-0 w-9 rounded-lg border py-1 text-center ${i === idx ? 'bg-accent text-[#04130d] border-accent' : 'bg-surface-2 border-line text-muted'}`}
          >
            <div className="text-[12px] font-bold leading-tight">{h.number}</div>
            <div className="text-[9px]">P{h.par}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
