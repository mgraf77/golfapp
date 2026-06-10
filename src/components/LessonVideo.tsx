import { useEffect, useRef, useState } from 'react'
import type { Storyboard } from '../lib/storyboards'
import { speakAsync, stopSpeaking, voiceAvailable } from '../lib/voice'

/**
 * The AI video player: renders generated storyboard scenes on canvas with
 * synchronized voice narration. Pausable, scene-skippable, fullscreen.
 */

export function LessonVideo({ board, onClose }: { board: Storyboard; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scene, setScene] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(!voiceAvailable())
  const sceneStartRef = useRef(performance.now())
  const pausedAtRef = useRef<number | null>(null)
  const advanceRef = useRef<{ narrationDone: boolean; minDone: boolean }>({ narrationDone: false, minDone: false })

  const current = board.scenes[Math.min(scene, board.scenes.length - 1)]

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

  // pause/resume narration
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

  // render + auto-advance loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const tick = (now: number) => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * devicePixelRatio) {
        canvas.width = w * devicePixelRatio
        canvas.height = h * devicePixelRatio
      }
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      const elapsed = (pausedAtRef.current ?? now) - sceneStartRef.current
      const dur = Math.max(current.minMs, 3000) + (muted ? Math.min(current.narration.length * 28, 6000) : 0)
      const t = Math.max(0, Math.min(1, elapsed / dur))
      current.draw(ctx, t, w, h)

      if (playing && elapsed >= dur) advanceRef.current.minDone = true
      if (playing && advanceRef.current.minDone && advanceRef.current.narrationDone) {
        if (scene < board.scenes.length - 1) setScene(scene + 1)
        else setPlaying(false)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [current, playing, scene, board.scenes.length, muted])

  useEffect(() => () => stopSpeaking(), [])

  const finished = !playing && scene === board.scenes.length - 1 && advanceRef.current.minDone

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-accent-bright font-semibold">AI video lesson</div>
          <div className="text-sm font-bold text-white truncate">{board.title}</div>
        </div>
        <button onClick={onClose} className="rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-white text-sm font-semibold shrink-0">
          Close
        </button>
      </div>

      <div className="flex-1 flex items-center px-3">
        <div className="w-full max-w-2xl mx-auto">
          <canvas ref={canvasRef} className="w-full aspect-[16/10] rounded-2xl border border-white/10" />
          <div className="mt-3 min-h-[44px] text-center px-2">
            <p className="text-[15px] text-white/90 font-medium leading-snug">{current.caption}</p>
          </div>
        </div>
      </div>

      <div className="pb-[max(env(safe-area-inset-bottom),16px)] px-4">
        {/* scene dots */}
        <div className="flex justify-center gap-1.5 mb-3">
          {board.scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => { setScene(i); setPlaying(true) }}
              className={`h-1.5 rounded-full transition-all ${i === scene ? 'w-6 bg-accent' : 'w-1.5 bg-white/25'}`}
              aria-label={`Scene ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={() => { setScene(Math.max(0, scene - 1)); setPlaying(true) }}
            disabled={scene === 0}
            className="h-11 w-11 rounded-full bg-white/10 border border-white/15 text-white disabled:opacity-30"
          >
            ⏮
          </button>
          {finished ? (
            <button onClick={() => { setScene(0); setPlaying(true) }} className="h-13 px-6 py-3 rounded-full bg-accent text-[#04130d] font-bold">
              ↻ Replay
            </button>
          ) : (
            <button onClick={() => setPlaying(!playing)} className="h-13 w-13 px-5 py-3 rounded-full bg-accent text-[#04130d] font-bold text-lg">
              {playing ? '⏸' : '▶'}
            </button>
          )}
          <button
            onClick={() => { setScene(Math.min(board.scenes.length - 1, scene + 1)); setPlaying(true) }}
            disabled={scene >= board.scenes.length - 1}
            className="h-11 w-11 rounded-full bg-white/10 border border-white/15 text-white disabled:opacity-30"
          >
            ⏭
          </button>
          {voiceAvailable() && (
            <button
              onClick={() => setMuted(!muted)}
              className={`h-11 w-11 rounded-full border ${muted ? 'bg-white/10 border-white/15 text-white/60' : 'bg-accent/20 border-accent/40 text-accent-bright'}`}
              aria-label="Toggle narration"
            >
              {muted ? '🔇' : '🔊'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
