import { useEffect, useRef, useState } from 'react'
import type { Storyboard } from '../lib/storyboards'
import { speakAsync, stopSpeaking, voiceAvailable } from '../lib/voice'

/**
 * AI video player v2: portrait-first canvas that fills the phone,
 * synchronized narration, tap to play/pause, swipe between scenes,
 * per-scene + overall progress.
 */

export function LessonVideo({ board, onClose }: { board: Storyboard; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scene, setScene] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(!voiceAvailable())
  const [sceneT, setSceneT] = useState(0)
  const sceneStartRef = useRef(performance.now())
  const pausedAtRef = useRef<number | null>(null)
  const advanceRef = useRef({ narrationDone: false, minDone: false })
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null)

  const current = board.scenes[Math.min(scene, board.scenes.length - 1)]
  const isLast = scene >= board.scenes.length - 1

  // narration per scene
  useEffect(() => {
    advanceRef.current = { narrationDone: muted, minDone: false }
    sceneStartRef.current = performance.now()
    pausedAtRef.current = playing ? null : performance.now()
    if (!muted && playing) {
      let cancelled = false
      speakAsync(current.narration, 1.0).then(() => {
        if (!cancelled) advanceRef.current.narrationDone = true
      })
      return () => {
        cancelled = true
        stopSpeaking()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, muted])

  // pause/resume narration with playback
  useEffect(() => {
    if (!voiceAvailable()) return
    if (!playing) {
      window.speechSynthesis.pause()
      pausedAtRef.current = performance.now()
    } else {
      window.speechSynthesis.resume()
      if (pausedAtRef.current != null) {
        sceneStartRef.current += performance.now() - pausedAtRef.current
        pausedAtRef.current = null
      }
    }
  }, [playing])

  // render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const tick = (now: number) => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w && h && (canvas.width !== Math.round(w * devicePixelRatio) || canvas.height !== Math.round(h * devicePixelRatio))) {
        canvas.width = Math.round(w * devicePixelRatio)
        canvas.height = Math.round(h * devicePixelRatio)
      }
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      const elapsed = (pausedAtRef.current ?? now) - sceneStartRef.current
      const dur = Math.max(current.minMs, 3000) + (muted ? Math.min(current.narration.length * 30, 7000) : 0)
      const t = Math.max(0, Math.min(1, elapsed / dur))
      setSceneT(t)
      current.draw(ctx, t, w, h)

      if (playing && elapsed >= dur) advanceRef.current.minDone = true
      if (playing && advanceRef.current.minDone && advanceRef.current.narrationDone) {
        if (!isLast) setScene((s) => s + 1)
        else setPlaying(false)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [current, playing, isLast, muted])

  useEffect(() => () => stopSpeaking(), [])

  function go(delta: number) {
    setScene((s) => Math.max(0, Math.min(board.scenes.length - 1, s + delta)))
    setPlaying(true)
  }

  const finished = !playing && isLast && advanceRef.current.minDone

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2 z-10">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-accent-bright font-bold">▶ AI video · scene {scene + 1}/{board.scenes.length}</div>
          <div className="text-[15px] font-bold text-white truncate">{board.title}</div>
        </div>
        <button onClick={onClose} className="h-9 w-9 shrink-0 rounded-full bg-white/10 border border-white/15 text-white text-sm font-bold">
          ✕
        </button>
      </div>

      {/* progress: one segment per scene */}
      <div className="shrink-0 flex gap-1 px-4 pb-2 z-10">
        {board.scenes.map((_, i) => (
          <button key={i} onClick={() => { setScene(i); setPlaying(true) }} className="h-1 flex-1 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: i < scene ? '100%' : i === scene ? `${sceneT * 100}%` : '0%' }}
            />
          </button>
        ))}
      </div>

      {/* canvas — tap to play/pause, swipe to change scene */}
      <div
        className="flex-1 relative min-h-0"
        onTouchStart={(e) => {
          touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
        }}
        onTouchEnd={(e) => {
          const s = touchRef.current
          touchRef.current = null
          if (!s) return
          const dx = e.changedTouches[0].clientX - s.x
          const dy = e.changedTouches[0].clientY - s.y
          if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
          else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && Date.now() - s.t < 350) setPlaying((p) => !p)
        }}
        onClick={(e) => {
          // mouse / desktop fallback (touch handled above)
          if ((e.nativeEvent as PointerEvent).pointerType !== 'touch' && !('ontouchstart' in window)) setPlaying((p) => !p)
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {!playing && !finished && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-16 w-16 rounded-full bg-black/50 border border-white/25 flex items-center justify-center text-white text-2xl pl-1">▶</div>
          </div>
        )}
        {finished && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
            <button onClick={() => { setScene(0); setPlaying(true) }} className="rounded-full bg-accent text-[#04130d] font-bold px-7 py-3.5 text-[15px]">
              ↻ Watch again
            </button>
            <button onClick={onClose} className="text-white/70 text-sm underline underline-offset-4">Back to the lesson</button>
          </div>
        )}
        {/* caption overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent px-5 pt-10 pb-3 pointer-events-none">
          <p className="text-[15px] text-white font-semibold leading-snug text-center max-w-md mx-auto">{current.caption}</p>
        </div>
      </div>

      {/* controls */}
      <div className="shrink-0 pb-[max(env(safe-area-inset-bottom),14px)] pt-2.5 px-4 z-10">
        <div className="flex justify-center items-center gap-4">
          <button onClick={() => go(-1)} disabled={scene === 0} className="h-11 w-11 rounded-full bg-white/10 border border-white/15 text-white text-sm disabled:opacity-30">
            ⏮
          </button>
          <button onClick={() => setPlaying((p) => !p)} className="h-14 w-14 rounded-full bg-accent text-[#04130d] font-bold text-xl shadow-[0_0_28px_rgba(52,211,153,0.4)]">
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={() => go(1)} disabled={isLast} className="h-11 w-11 rounded-full bg-white/10 border border-white/15 text-white text-sm disabled:opacity-30">
            ⏭
          </button>
          {voiceAvailable() && (
            <button
              onClick={() => setMuted((m) => !m)}
              className={`absolute right-5 h-11 w-11 rounded-full border text-sm ${muted ? 'bg-white/10 border-white/15 text-white/60' : 'bg-accent/20 border-accent/40 text-accent-bright'}`}
              aria-label="Toggle narration"
            >
              {muted ? '🔇' : '🔊'}
            </button>
          )}
        </div>
        <p className="text-center text-[10px] text-white/35 mt-2">tap video to pause · swipe for scenes</p>
      </div>
    </div>
  )
}
