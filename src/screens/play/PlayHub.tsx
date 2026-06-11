import { useEffect, useRef, useState } from 'react'
import type { CourseSearchResult, GeoCourse, WeatherSnapshot } from '../../types/geo'
import { courseStore } from '../../lib/idb'
import { getApproxLocation } from '../../lib/geo'
import { downloadCourse, searchCoursesByName, searchCoursesNearby } from '../../lib/overpass'
import { fetchWeather } from '../../lib/weather'
import { useAppState } from '../../hooks/useAppState'
import { Badge, Button, Card, SectionTitle, inputClass } from '../../components/ui'
import { PlayLobby } from '../Play'
import { RoundPreview } from './RoundPreview'

/**
 * Round start hub. The six nearest real courses load automatically
 * (GPS → IP-location fallback), downloads are one tap, and every
 * downloaded course offers Start round + a strategy Preview.
 */

const NEARBY_CACHE_KEY = 'truecaddie-nearby-v1'

export function PlayHub() {
  const { dispatch } = useAppState()
  const [courses, setCourses] = useState<GeoCourse[] | null>(null)
  const [nearby, setNearby] = useState<CourseSearchResult[] | null>(loadCachedNearby())
  const [nearbyStatus, setNearbyStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [nearbyNote, setNearbyNote] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CourseSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [starting, setStarting] = useState<string | null>(null)
  const [preview, setPreview] = useState<GeoCourse | null>(null)
  const [showCard, setShowCard] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedOnce = useRef(false)

  const refresh = () => courseStore.list().then((c) => setCourses(c.sort((a, b) => b.downloadedAt - a.downloadedAt)))
  useEffect(() => {
    refresh().catch(() => setCourses([]))
  }, [])

  // auto-load the 6 closest courses
  useEffect(() => {
    if (loadedOnce.current) return
    loadedOnce.current = true
    loadNearby()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadNearby() {
    setNearbyStatus('loading')
    setNearbyNote(null)
    try {
      const { at, source } = await getApproxLocation()
      const found = await searchCoursesNearby(at, 45)
      const six = found.slice(0, 6)
      setNearby(six)
      setNearbyStatus('ready')
      if (source === 'ip') setNearbyNote('Using approximate location — enable location services for exact distances.')
      if (!six.length) setNearbyNote('No mapped courses within ~30 miles. Search by name below.')
      try {
        localStorage.setItem(NEARBY_CACHE_KEY, JSON.stringify(six))
      } catch { /* ignore */ }
    } catch (e) {
      setNearbyStatus('error')
      setNearbyNote((e as Error).message || 'Could not load nearby courses.')
    }
  }

  async function runSearch() {
    if (query.trim().length < 3) return
    setSearching(true)
    setError(null)
    try {
      const found = await searchCoursesByName(query.trim())
      setSearchResults(found)
      if (!found.length) setError('Nothing found — try the course\'s full name.')
    } catch (e) {
      setError((e as Error).message || 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  async function download(r: CourseSearchResult) {
    setDownloading(r.id)
    setError(null)
    try {
      const course = await downloadCourse(r)
      await courseStore.save(course)
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDownloading(null)
    }
  }

  async function startGpsRound(course: GeoCourse) {
    setStarting(course.id)
    let weather: WeatherSnapshot | null = null
    try {
      weather = await fetchWeather(course.center)
    } catch { /* offline — caddie skips wind */ }
    dispatch({ type: 'START_GPS_ROUND', course, weather })
    setStarting(null)
  }

  if (preview) return <RoundPreview course={preview} onBack={() => setPreview(null)} onStart={() => { const c = preview; setPreview(null); startGpsRound(c) }} />

  const downloadedIds = new Set((courses ?? []).map((c) => c.id))
  const results = searchResults ?? nearby ?? []

  return (
    <div className="animate-rise">
      {/* My courses */}
      {courses !== null && courses.length > 0 && (
        <>
          <SectionTitle>My courses</SectionTitle>
          <div className="flex flex-col gap-3">
            {courses.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {c.holes.length} holes · Par {c.par} · {c.yards.toLocaleString()} yds
                    </div>
                    <div className="mt-1.5"><Badge tone="good">Offline ready</Badge></div>
                  </div>
                  <button
                    onClick={async () => { await courseStore.remove(c.id); refresh() }}
                    className="text-faint text-xs shrink-0 px-1 py-0.5"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2 mt-3">
                  <Button onClick={() => startGpsRound(c)} disabled={starting === c.id}>
                    {starting === c.id ? 'Checking weather…' : '⛳ Start round'}
                  </Button>
                  <Button variant="secondary" onClick={() => setPreview(c)}>🔭 Preview</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Find courses */}
      <SectionTitle
        action={
          searchResults ? (
            <button onClick={() => { setSearchResults(null); setQuery(''); setError(null) }} className="text-[13px] font-semibold text-accent-bright">
              ← Nearby
            </button>
          ) : (
            <button onClick={loadNearby} className="text-[13px] font-semibold text-accent-bright">↻ Refresh</button>
          )
        }
      >
        {searchResults ? 'Search results' : 'Courses near you'}
      </SectionTitle>

      <div className="flex gap-2 mb-2.5">
        <input
          className={inputClass}
          placeholder="Search any course (e.g. Pebble Beach)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
        />
        <Button onClick={runSearch} disabled={searching || query.trim().length < 3}>
          {searching ? '…' : 'Search'}
        </Button>
      </div>

      {error && <Card className="mb-2.5 !py-2.5 text-sm text-danger">{error}</Card>}
      {nearbyNote && !searchResults && <p className="text-[11px] text-faint mb-2 px-0.5">{nearbyNote}</p>}

      {nearbyStatus === 'loading' && !results.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-muted px-0.5 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            Finding the closest courses…
          </p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-3.5 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="skeleton h-4 w-2/3 mb-2" />
                <div className="skeleton h-3 w-1/3" />
              </div>
              <div className="skeleton h-9 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      ) : nearbyStatus === 'error' && !results.length ? (
        <Card className="text-sm text-muted">
          {nearbyNote ?? 'Could not load nearby courses.'}{' '}
          <button onClick={loadNearby} className="text-accent-bright font-semibold">Retry</button>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((r) => (
            <Card key={r.id} className="!p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{r.name}</div>
                  <div className="text-xs text-muted truncate">
                    {r.distanceMi != null ? `${r.distanceMi.toFixed(1)} mi away` : r.location}
                  </div>
                </div>
                {downloadedIds.has(r.id) ? (
                  <Badge tone="good">Downloaded</Badge>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => download(r)} disabled={downloading !== null}>
                    {downloading === r.id ? 'Mapping…' : '⬇ Download'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="text-[11px] text-faint mt-2 leading-relaxed px-0.5">
        Hole-by-hole maps come from OpenStreetMap. Downloads live on your phone and work offline.
      </p>

      {/* Card mode */}
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
          No GPS? Play a demo course card-style with the same caddie and recaps. Round history lives here too.
        </Card>
      )}
    </div>
  )
}

function loadCachedNearby(): CourseSearchResult[] | null {
  try {
    const raw = localStorage.getItem(NEARBY_CACHE_KEY)
    return raw ? (JSON.parse(raw) as CourseSearchResult[]) : null
  } catch {
    return null
  }
}
