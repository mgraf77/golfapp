import { useEffect, useState } from 'react'
import type { CourseSearchResult, GeoCourse, WeatherSnapshot } from '../../types/geo'
import { courseStore } from '../../lib/idb'
import { getOnce } from '../../lib/geo'
import { downloadCourse, searchCoursesByName, searchCoursesNearby } from '../../lib/overpass'
import { fetchWeather } from '../../lib/weather'
import { useAppState } from '../../hooks/useAppState'
import { Badge, Button, Card, EmptyState, SectionTitle, Sheet, inputClass } from '../../components/ui'
import { PlayLobby } from '../Play'

/**
 * Round start hub: the downloaded-course library (GPS rounds on real
 * satellite imagery) plus the find-courses flow, with card-mode demo
 * rounds tucked underneath.
 */

export function PlayHub() {
  const { dispatch } = useAppState()
  const [courses, setCourses] = useState<GeoCourse[] | null>(null)
  const [showFind, setShowFind] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => courseStore.list().then((c) => setCourses(c.sort((a, b) => b.downloadedAt - a.downloadedAt)))
  useEffect(() => {
    refresh().catch(() => setCourses([]))
  }, [])

  async function startGpsRound(course: GeoCourse) {
    setStarting(course.id)
    setError(null)
    let weather: WeatherSnapshot | null = null
    try {
      weather = await fetchWeather(course.center)
    } catch {
      // offline — round still works, caddie skips wind
    }
    dispatch({ type: 'START_GPS_ROUND', course, weather })
    setStarting(null)
  }

  async function remove(id: string) {
    await courseStore.remove(id)
    refresh()
  }

  return (
    <div className="animate-rise">
      <SectionTitle
        action={
          <button onClick={() => setShowFind(true)} className="text-[13px] font-semibold text-accent-bright">
            + Find courses
          </button>
        }
      >
        My courses
      </SectionTitle>

      {courses === null ? (
        <Card className="text-sm text-muted">Loading your course library…</Card>
      ) : courses.length === 0 ? (
        <EmptyState
          icon="🛰️"
          title="No courses downloaded"
          sub="Download any real course — full satellite hole maps, greens, bunkers and water, stored offline like Arccos course files."
          action={<Button onClick={() => setShowFind(true)}>Find my course</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {c.holes.length} holes · Par {c.par} · {c.yards.toLocaleString()} yds
                    {c.location ? ` · ${c.location}` : ''}
                  </div>
                  <div className="mt-1.5 flex gap-1.5 flex-wrap">
                    <Badge tone="good">Offline ready</Badge>
                    {c.ratingEstimated && <Badge>Rating est. {c.rating}/{c.slope}</Badge>}
                  </div>
                </div>
                <button onClick={() => remove(c.id)} className="text-faint text-xs shrink-0 px-1 py-0.5">
                  Remove
                </button>
              </div>
              <Button className="w-full mt-3" onClick={() => startGpsRound(c)} disabled={starting === c.id}>
                {starting === c.id ? 'Checking weather…' : '⛳ Start GPS round'}
              </Button>
            </Card>
          ))}
        </div>
      )}
      {error && <Card className="mt-3 text-sm text-danger">{error}</Card>}

      <SectionTitle
        action={
          <button onClick={() => setShowCard((v) => !v)} className="text-[13px] font-semibold text-accent-bright">
            {showCard ? 'Hide' : 'Show'}
          </button>
        }
      >
        Card mode & history
      </SectionTitle>
      {showCard ? (
        <PlayLobby />
      ) : (
        <Card className="text-sm text-muted" onClick={() => setShowCard(true)}>
          No GPS? Play a demo course card-style with the same caddie, shot logging and recaps. Your round history lives here too.
        </Card>
      )}

      <FindCoursesSheet open={showFind} onClose={() => setShowFind(false)} onDownloaded={refresh} />
    </div>
  )
}

// ── Find & download ─────────────────────────────────────────────────────

function FindCoursesSheet({
  open, onClose, onDownloaded,
}: { open: boolean; onClose: () => void; onDownloaded: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CourseSearchResult[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  async function nearby() {
    setBusy('nearby')
    setError(null)
    try {
      const fix = await getOnce()
      const found = await searchCoursesNearby(fix)
      setResults(found)
      if (!found.length) setError('No mapped courses within 25 miles. Try searching by name.')
    } catch (e) {
      setError((e as Error).message || 'Could not get your location.')
    } finally {
      setBusy(null)
    }
  }

  async function byName() {
    if (query.trim().length < 3) return
    setBusy('name')
    setError(null)
    try {
      const found = await searchCoursesByName(query.trim())
      setResults(found)
      if (!found.length) setError('Nothing found — try the course’s full name.')
    } catch (e) {
      setError((e as Error).message || 'Search failed.')
    } finally {
      setBusy(null)
    }
  }

  async function download(r: CourseSearchResult) {
    setDownloading(r.id)
    setError(null)
    try {
      const course = await downloadCourse(r)
      await courseStore.save(course)
      setDone((s) => new Set(s).add(r.id))
      onDownloaded()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Find courses">
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="Course name (e.g. Pebble Beach)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && byName()}
        />
        <Button onClick={byName} disabled={busy !== null || query.trim().length < 3}>
          {busy === 'name' ? '…' : 'Search'}
        </Button>
      </div>
      <Button variant="secondary" className="w-full mt-2" onClick={nearby} disabled={busy !== null}>
        {busy === 'nearby' ? 'Locating…' : '📍 Courses near me'}
      </Button>
      <p className="text-[11px] text-faint mt-2 leading-relaxed">
        Course maps come from OpenStreetMap — most well-known courses have full hole-by-hole data
        (greens, bunkers, water). Downloads are stored on your phone and work offline.
      </p>

      {error && <div className="mt-3 text-sm text-danger">{error}</div>}

      {results && (
        <div className="mt-4 flex flex-col gap-2.5 pb-2">
          {results.map((r) => (
            <Card key={r.id} className="!p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{r.name}</div>
                  <div className="text-xs text-muted truncate">
                    {r.distanceMi != null ? `${r.distanceMi.toFixed(1)} mi away` : r.location}
                  </div>
                </div>
                {done.has(r.id) ? (
                  <Badge tone="good">Downloaded</Badge>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => download(r)} disabled={downloading !== null}>
                    {downloading === r.id ? 'Mapping…' : 'Download'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Sheet>
  )
}
