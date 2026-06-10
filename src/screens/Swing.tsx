import { useEffect, useRef, useState } from 'react'
import type { SwingRecord, SwingReport, TracerPoint } from '../types/geo'
import { getDrill } from '../data/drills'
import { swingStore } from '../lib/idb'
import { analyzeSwing } from '../lib/swingAnalysis'
import { fmtDate, uid } from '../lib/utils'
import { DrillCard } from '../components/DrillCard'
import { SwingPlayer, exportTracerVideo, type SwingPlayerHandle, type SwingTool } from '../components/SwingPlayer'
import { Badge, Button, Card, EmptyState, Meter, ProgressRing, SectionTitle } from '../components/ui'

/**
 * Swing Studio: record or import a swing, review it frame by frame with
 * coach ink, run on-device AI pose analysis (tempo, sway, posture →
 * faults → prescribed drills), and burn ShotTracer-style ball flights
 * into shareable clips.
 */

export function Swing() {
  const [swings, setSwings] = useState<SwingRecord[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const captureRef = useRef<HTMLInputElement>(null)

  const refresh = () => swingStore.list().then(setSwings)
  useEffect(() => {
    refresh().catch(() => setSwings([]))
  }, [])

  async function addVideo(file: File) {
    const id = uid('swing_')
    const rec: SwingRecord = {
      id,
      name: `Swing · ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      date: new Date().toISOString(),
      durationS: 0,
      mimeType: file.type || 'video/mp4',
    }
    await swingStore.saveVideo(id, file)
    await swingStore.save(rec)
    await refresh()
    setOpenId(id)
  }

  if (openId) {
    return (
      <SwingDetail
        id={openId}
        onBack={() => {
          setOpenId(null)
          refresh()
        }}
      />
    )
  }

  return (
    <div className="animate-rise">
      <input
        ref={captureRef} type="file" accept="video/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && addVideo(e.target.files[0])}
      />
      <input
        ref={fileRef} type="file" accept="video/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && addVideo(e.target.files[0])}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <Button size="lg" onClick={() => captureRef.current?.click()}>🎥 Record swing</Button>
        <Button size="lg" variant="secondary" onClick={() => fileRef.current?.click()}>Import video</Button>
      </div>
      <Card className="mt-2.5 !py-3">
        <p className="text-[12px] text-muted leading-relaxed">
          <span className="text-ink font-medium">Filming tips:</span> face-on or down-the-line, phone steady at hip
          height, full body in frame, normal speed (slo-mo capture works too). 3–8 seconds is perfect.
        </p>
      </Card>

      <SectionTitle>My swings</SectionTitle>
      {swings === null ? (
        <Card className="text-sm text-muted">Loading…</Card>
      ) : swings.length === 0 ? (
        <EmptyState
          icon="🎬"
          title="No swings yet"
          sub="Record your swing and the AI coach will measure tempo, sway and posture — then prescribe the exact drills to fix what it finds."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {swings.map((s) => (
            <Card key={s.id} onClick={() => setOpenId(s.id)} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{s.name}</div>
                <div className="text-xs text-muted mt-0.5">{fmtDate(s.date)}{s.tracer?.length ? ' · tracer' : ''}</div>
              </div>
              {s.report ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={s.report.score >= 75 ? 'good' : s.report.score >= 55 ? 'gold' : 'bad'}>
                    {s.report.score}
                  </Badge>
                  <span className="text-xs text-muted">{s.report.tempoRatio}:1</span>
                </div>
              ) : (
                <Badge>Not analyzed</Badge>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Detail ──────────────────────────────────────────────────────────────

function SwingDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [rec, setRec] = useState<SwingRecord | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [tool, setTool] = useState<SwingTool>('none')
  const [color, setColor] = useState('#fbbf24')
  const [tracer, setTracer] = useState<TracerPoint[]>([])
  const [analyzing, setAnalyzing] = useState<number | null>(null)
  const [exporting, setExporting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<SwingPlayerHandle>(null)

  useEffect(() => {
    let url: string | null = null
    Promise.all([swingStore.get(id), swingStore.getVideo(id)]).then(([r, blob]) => {
      if (!r || !blob) return setError('Video not found on this device.')
      url = URL.createObjectURL(blob)
      setRec(r)
      setTracer(r.tracer ?? [])
      setSrc(url)
    })
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [id])

  async function persist(patch: Partial<SwingRecord>) {
    if (!rec) return
    const next = { ...rec, ...patch }
    setRec(next)
    await swingStore.save(next)
  }

  async function runAnalysis() {
    const video = playerRef.current?.video
    if (!video) return
    setError(null)
    setAnalyzing(0)
    try {
      const report: SwingReport = await analyzeSwing(video, setAnalyzing)
      await persist({ report, durationS: video.duration })
    } catch (e) {
      setError((e as Error).message || 'Analysis failed — check your connection (the AI model downloads on first use).')
    } finally {
      setAnalyzing(null)
    }
  }

  async function runExport() {
    const video = playerRef.current?.video
    if (!video || tracer.length < 2) return
    setExporting(0)
    try {
      const blob = await exportTracerVideo(video, tracer, setExporting)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `tracer-${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      setError('Export not supported in this browser.')
    } finally {
      setExporting(null)
    }
  }

  if (error && !src) {
    return (
      <Card className="animate-rise">
        <p className="text-sm text-danger mb-3">{error}</p>
        <Button variant="secondary" onClick={onBack}>← Back</Button>
      </Card>
    )
  }
  if (!rec || !src) return <Card className="animate-rise text-sm text-muted">Opening swing…</Card>

  const report = rec.report
  const markers = report
    ? [
        { t: report.events.address, label: 'Address' },
        { t: report.events.top, label: 'Top' },
        { t: report.events.impact, label: 'Impact' },
      ]
    : []

  return (
    <div className="animate-rise">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-sm text-muted px-1 py-1">← Swings</button>
        <button
          onClick={async () => {
            await swingStore.remove(id)
            onBack()
          }}
          className="text-xs text-danger/80 px-1 py-1"
        >
          Delete
        </button>
      </div>

      <SwingPlayer
        ref={playerRef}
        src={src}
        tool={tool}
        color={color}
        tracer={tracer}
        onTracerChange={(pts) => {
          setTracer(pts)
          persist({ tracer: pts })
        }}
        markers={markers}
      />

      {/* tools */}
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {([['none', '👆 Play'], ['draw', '✏️ Ink'], ['line', '📏 Line'], ['circle', '⭕ Circle'], ['trace', '🔥 Tracer']] as [SwingTool, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium ${tool === t ? 'bg-accent text-[#04130d] border-accent' : 'bg-surface-2 border-line text-muted'}`}
          >
            {label}
          </button>
        ))}
        {(tool === 'draw' || tool === 'line' || tool === 'circle') &&
          ['#fbbf24', '#f87171', '#34d399'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 shrink-0 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
      </div>

      {tool === 'trace' && (
        <Card className="mt-2 !py-3">
          <p className="text-[12px] text-muted leading-relaxed">
            Scrub to launch, tap the ball, then again mid-flight and at landing (3–6 taps).
            Play back to watch the comet. {tracer.length >= 2 && 'Looking good —'}
          </p>
          <div className="flex gap-2 mt-2">
            {tracer.length > 0 && (
              <Button size="sm" variant="secondary" onClick={() => { setTracer([]); persist({ tracer: [] }) }}>
                Clear tracer
              </Button>
            )}
            {tracer.length >= 2 && (
              <Button size="sm" onClick={runExport} disabled={exporting !== null}>
                {exporting !== null ? `Exporting ${exporting}%` : '📤 Export clip'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* analysis */}
      {!report ? (
        <Card glow className="mt-3 text-center py-6">
          {analyzing !== null ? (
            <>
              <ProgressRing value={analyzing} sub="analyzing" />
              <p className="text-xs text-muted mt-2">Reading body positions frame by frame — stays on your phone.</p>
            </>
          ) : (
            <>
              <div className="font-semibold mb-1">AI swing analysis</div>
              <p className="text-sm text-muted mb-3 max-w-[300px] mx-auto">
                Tempo ratio, hip sway, head movement, posture and turn — measured from the video, with drills prescribed for what it finds.
              </p>
              <Button onClick={runAnalysis}>🤖 Analyze my swing</Button>
            </>
          )}
          {error && <p className="text-xs text-danger mt-3">{error}</p>}
        </Card>
      ) : (
        <SwingReportView report={report} onReanalyze={runAnalysis} analyzing={analyzing} />
      )}
    </div>
  )
}

function SwingReportView({ report, onReanalyze, analyzing }: { report: SwingReport; onReanalyze: () => void; analyzing: number | null }) {
  const drillIds = [...new Set(report.faults.flatMap((f) => f.drillIds))].slice(0, 3)
  return (
    <div className="mt-3">
      <Card glow>
        <div className="flex items-center gap-4">
          <ProgressRing value={report.score} size={84} sub="swing score" />
          <div className="min-w-0">
            <div className="font-semibold">Tempo {report.tempoRatio} : 1</div>
            <p className="text-[13px] text-muted leading-relaxed mt-1">{report.summary}</p>
          </div>
        </div>
      </Card>

      <SectionTitle>Measurements</SectionTitle>
      <Card>
        <div className="flex flex-col gap-3.5">
          {report.metrics.map((m) => (
            <div key={m.key}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium">{m.label}</span>
                <span className="text-sm tabular-nums text-accent-bright font-semibold">{m.value}</span>
              </div>
              <Meter value={100 - m.score} tone={m.score >= 70 ? 'good' : 'auto'} />
              <p className="text-[12px] text-muted mt-1 leading-snug">{m.comment} <span className="text-faint">Ideal: {m.ideal}</span></p>
            </div>
          ))}
        </div>
      </Card>

      {report.faults.length > 0 && (
        <>
          <SectionTitle>What to fix first</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {report.faults.map((f) => (
              <Card key={f.id}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{f.name}</span>
                  <Badge tone={f.severity === 'major' ? 'bad' : f.severity === 'moderate' ? 'gold' : 'default'}>
                    {f.severity}
                  </Badge>
                </div>
                <p className="text-[12px] text-faint mt-1">{f.evidence}</p>
                <p className="text-[13px] text-muted mt-1.5 leading-relaxed">💡 {f.fix}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      {drillIds.length > 0 && (
        <>
          <SectionTitle>Prescribed drills</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {drillIds.map((d) => (
              <DrillCard key={d} drill={getDrill(d)} />
            ))}
          </div>
        </>
      )}

      <div className="mt-4 text-center">
        <button onClick={onReanalyze} className="text-[12px] text-muted underline underline-offset-4">
          {analyzing !== null ? `Re-analyzing ${analyzing}%…` : 'Re-run analysis'}
        </button>
      </div>
    </div>
  )
}
