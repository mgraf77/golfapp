import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { TracerPoint } from '../types/geo'

/**
 * The video bench of the Swing Studio:
 *  - scrubber, 0.1×–1× playback, frame-by-frame stepping
 *  - coach drawing layer (freehand / line / circle, three ink colors)
 *  - ShotTracer-style ball-flight tracer: tap the ball at a few moments,
 *    we fit a smooth comet path and animate it over playback, exportable
 *    as a video clip.
 */

export type SwingTool = 'none' | 'draw' | 'line' | 'circle' | 'trace'

interface Drawing {
  tool: 'draw' | 'line' | 'circle'
  color: string
  pts: { x: number; y: number }[]
}

export interface SwingPlayerHandle {
  video: HTMLVideoElement | null
}

interface Props {
  src: string
  tool: SwingTool
  color: string
  tracer: TracerPoint[]
  onTracerChange: (pts: TracerPoint[]) => void
  markers?: { t: number; label: string }[]
}

export const SwingPlayer = forwardRef<SwingPlayerHandle, Props>(function SwingPlayer(
  { src, tool, color, tracer, onTracerChange, markers = [] },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const drawingsRef = useRef<Drawing[]>([])
  const activeRef = useRef<Drawing | null>(null)
  const rafRef = useRef(0)

  useImperativeHandle(ref, () => ({ video: videoRef.current }))

  // render loop: time readout + overlay compositing
  const paint = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (canvas.width !== w * devicePixelRatio || canvas.height !== h * devicePixelRatio) {
      canvas.width = w * devicePixelRatio
      canvas.height = h * devicePixelRatio
    }
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    ctx.clearRect(0, 0, w, h)
    drawOverlay(ctx, w, h, video.currentTime, drawingsRef.current, activeRef.current, tracer, tool === 'trace')
    setTime(video.currentTime)
    rafRef.current = requestAnimationFrame(paint)
  }, [tracer, tool])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(rafRef.current)
  }, [paint])

  // pointer interactions on the overlay
  function localPoint(e: React.PointerEvent): { x: number; y: number } {
    const rect = wrapRef.current!.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    const video = videoRef.current
    if (!video) return
    const p = localPoint(e)
    if (tool === 'trace') {
      const t = video.currentTime
      const next = [...tracer.filter((k) => Math.abs(k.t - t) > 0.04), { t, x: p.x, y: p.y }].sort((a, b) => a.t - b.t)
      onTracerChange(next)
      return
    }
    if (tool === 'none') {
      togglePlay()
      return
    }
    activeRef.current = { tool, color, pts: [p, p] }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const a = activeRef.current
    if (!a) return
    const p = localPoint(e)
    if (a.tool === 'draw') a.pts.push(p)
    else a.pts[1] = p
  }

  function onPointerUp() {
    if (activeRef.current) {
      drawingsRef.current = [...drawingsRef.current, activeRef.current]
      activeRef.current = null
    }
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.playbackRate = speed
      v.play().catch(() => {})
    } else v.pause()
  }

  function step(frames: number) {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = Math.min(duration, Math.max(0, v.currentTime + frames / 30))
  }

  function setRate(r: number) {
    setSpeed(r)
    if (videoRef.current) videoRef.current.playbackRate = r
  }

  return (
    <div>
      <div ref={wrapRef} className="relative rounded-2xl overflow-hidden border border-line bg-black select-none touch-none">
        <video
          ref={videoRef}
          src={src}
          playsInline
          muted
          className="w-full max-h-[52dvh] object-contain"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ cursor: tool === 'none' ? 'pointer' : 'crosshair' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
        {tool === 'trace' && (
          <div className="absolute top-2 left-2 right-2 text-center pointer-events-none">
            <span className="rounded-full bg-black/70 text-gold text-[11px] font-semibold px-3 py-1">
              Scrub, then tap the ball — {tracer.length} point{tracer.length === 1 ? '' : 's'} set
            </span>
          </div>
        )}
        {!playing && tool === 'none' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-14 w-14 rounded-full bg-black/55 border border-white/25 flex items-center justify-center text-white text-xl pl-1">▶</div>
          </div>
        )}
      </div>

      {/* scrubber */}
      <div className="mt-2 px-0.5">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={Math.max(duration, 0.01)}
            step={0.001}
            value={time}
            onChange={(e) => {
              const v = videoRef.current
              if (v) {
                v.pause()
                v.currentTime = Number(e.target.value)
              }
            }}
            className="w-full accent-[#10b981]"
          />
          {markers.map((m) => (
            <div
              key={m.label}
              className="absolute -top-1 -translate-x-1/2 text-[8px] font-bold text-gold pointer-events-none"
              style={{ left: `${(m.t / Math.max(duration, 0.01)) * 100}%` }}
              title={m.label}
            >
              ▾
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <button onClick={() => step(-1)} className="h-9 w-9 rounded-lg bg-surface-2 border border-line text-sm">⏮</button>
            <button onClick={togglePlay} className="h-9 w-12 rounded-lg bg-accent text-[#04130d] font-bold">
              {playing ? '⏸' : '▶'}
            </button>
            <button onClick={() => step(1)} className="h-9 w-9 rounded-lg bg-surface-2 border border-line text-sm">⏭</button>
          </div>
          <div className="flex gap-1">
            {[0.1, 0.25, 0.5, 1].map((r) => (
              <button
                key={r}
                onClick={() => setRate(r)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold border ${speed === r ? 'bg-accent text-[#04130d] border-accent' : 'bg-surface-2 border-line text-muted'}`}
              >
                {r}×
              </button>
            ))}
          </div>
          <span className="text-[11px] tabular-nums text-faint">{time.toFixed(2)}s</span>
        </div>
      </div>

      {(tool === 'draw' || tool === 'line' || tool === 'circle') && (
        <div className="mt-1.5 flex justify-end gap-2">
          <button
            onClick={() => {
              drawingsRef.current = drawingsRef.current.slice(0, -1)
            }}
            className="text-[12px] text-muted px-2 py-1"
          >
            Undo
          </button>
          <button
            onClick={() => {
              drawingsRef.current = []
            }}
            className="text-[12px] text-muted px-2 py-1"
          >
            Clear ink
          </button>
        </div>
      )}
    </div>
  )
})

// ── overlay rendering ───────────────────────────────────────────────────

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  drawings: Drawing[],
  active: Drawing | null,
  tracer: TracerPoint[],
  editingTracer: boolean,
) {
  for (const d of [...drawings, ...(active ? [active] : [])]) {
    ctx.strokeStyle = d.color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    if (d.tool === 'circle') {
      const [a, b] = d.pts
      const r = Math.hypot((b.x - a.x) * w, (b.y - a.y) * h)
      ctx.arc(a.x * w, a.y * h, Math.max(6, r), 0, Math.PI * 2)
    } else if (d.tool === 'line') {
      const [a, b] = d.pts
      ctx.moveTo(a.x * w, a.y * h)
      ctx.lineTo(b.x * w, b.y * h)
    } else {
      d.pts.forEach((p, i) => (i ? ctx.lineTo(p.x * w, p.y * h) : ctx.moveTo(p.x * w, p.y * h)))
    }
    ctx.stroke()
  }
  if (tracer.length) drawTracer(ctx, w, h, t, tracer, editingTracer)
}

export function drawTracer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  pts: TracerPoint[],
  editing: boolean,
) {
  if (editing) {
    for (const k of pts) {
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(k.x * w, k.y * h, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
  if (pts.length < 2) return
  // sample the catmull-rom path up to current time
  const t0 = pts[0].t
  const t1 = pts[pts.length - 1].t
  const progress = editing ? 1 : Math.min(1, Math.max(0, (t - t0) / Math.max(0.01, t1 - t0)))
  if (progress <= 0) return
  const path: { x: number; y: number }[] = []
  const steps = 80
  for (let i = 0; i <= steps * progress; i++) {
    const u = (i / steps) * (pts.length - 1)
    path.push(catmull(pts, u))
  }
  if (path.length < 2) return
  // comet: bright head, fading tail
  for (let i = 1; i < path.length; i++) {
    const frac = i / path.length
    ctx.strokeStyle = `rgba(251, 80, 60, ${0.15 + frac * 0.85})`
    ctx.lineWidth = 2 + frac * 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(path[i - 1].x * w, path[i - 1].y * h)
    ctx.lineTo(path[i].x * w, path[i].y * h)
    ctx.stroke()
  }
  const head = path[path.length - 1]
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(head.x * w, head.y * h, 3.5, 0, Math.PI * 2)
  ctx.fill()
}

function catmull(pts: TracerPoint[], u: number): { x: number; y: number } {
  const i = Math.floor(u)
  const f = u - i
  const p0 = pts[Math.max(0, i - 1)]
  const p1 = pts[Math.min(pts.length - 1, i)]
  const p2 = pts[Math.min(pts.length - 1, i + 1)]
  const p3 = pts[Math.min(pts.length - 1, i + 2)]
  const c = (a: number, b: number, cc: number, d: number) =>
    0.5 * (2 * b + (-a + cc) * f + (2 * a - 5 * b + 4 * cc - d) * f * f + (-a + 3 * b - 3 * cc + d) * f * f * f)
  return { x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) }
}

/** Export the video with the tracer burned in. Returns a webm/mp4 blob. */
export async function exportTracerVideo(
  video: HTMLVideoElement,
  tracer: TracerPoint[],
  onProgress: (pct: number) => void,
): Promise<Blob> {
  const w = video.videoWidth
  const h = video.videoHeight
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const stream = canvas.captureStream(30)
  const mime = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) ?? 'video/webm'
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 })
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)

  const start = Math.max(0, (tracer[0]?.t ?? 0) - 0.6)
  const end = Math.min(video.duration, (tracer[tracer.length - 1]?.t ?? video.duration) + 0.8)
  video.pause()
  video.playbackRate = 1
  video.currentTime = start

  return new Promise((resolve, reject) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }))
    rec.onerror = () => reject(new Error('Export failed'))
    rec.start(120)
    let raf = 0
    const tick = () => {
      ctx.drawImage(video, 0, 0, w, h)
      drawTracer(ctx, w, h, video.currentTime, tracer, false)
      onProgress(Math.round(((video.currentTime - start) / (end - start)) * 100))
      if (video.currentTime >= end || video.ended) {
        cancelAnimationFrame(raf)
        rec.stop()
        video.pause()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    video.play().then(() => {
      raf = requestAnimationFrame(tick)
    }).catch(reject)
  })
}
