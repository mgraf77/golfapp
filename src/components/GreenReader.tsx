import { useEffect, useRef, useState } from 'react'
import { Button, Sheet } from './ui'

/**
 * Green reading, AimPoint-style: feel the slope with your feet (1–4%),
 * dial the length and green speed, and get the aim point in cups outside
 * the edge — with an animated preview of how the putt will break.
 */

type BreakDir = 'L' | 'R' // ball breaks toward Left or Right (from the player's view)

interface Read {
  lengthFt: number
  slopePct: number
  dir: BreakDir
  elev: 'up' | 'flat' | 'down'
  stimp: number
}

/** Break in inches — AimPoint-flavored empirical model. */
function breakInches(r: Read): number {
  const speedFactor = Math.pow(r.stimp / 10, 1.6)
  const elevFactor = r.elev === 'up' ? 0.8 : r.elev === 'down' ? 1.3 : 1
  return 0.42 * r.lengthFt * r.slopePct * speedFactor * elevFactor
}

/** Effective putting distance after elevation. */
function effectiveFt(r: Read): number {
  const f = r.elev === 'up' ? 1.12 : r.elev === 'down' ? 0.85 : 1
  return r.lengthFt * f
}

const CUP_IN = 4.25

export function GreenReader({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [read, setRead] = useState<Read>({ lengthFt: 12, slopePct: 2, dir: 'R', elev: 'flat', stimp: 10 })

  const brk = breakInches(read)
  const cups = brk / CUP_IN
  const aimLabel =
    cups < 0.35 ? 'Inside edge — basically straight' :
    cups < 0.75 ? `${read.dir === 'R' ? 'Left' : 'Right'} edge of the cup` :
    `${cups.toFixed(1)} cups ${read.dir === 'R' ? 'left' : 'right'} of center`
  const eff = effectiveFt(read)

  return (
    <Sheet open={open} onClose={onClose} title="Green read">
      <div className="pb-3">
        <PuttPreview read={read} />

        {/* aim verdict */}
        <div className="mt-3 rounded-xl border border-accent/30 bg-accent/8 px-4 py-3 text-center">
          <div className="text-[11px] uppercase tracking-wider text-accent-bright font-semibold">Aim point</div>
          <div className="text-lg font-bold mt-0.5">{aimLabel}</div>
          <div className="text-[12px] text-muted mt-0.5">
            ~{Math.round(brk)}″ of break · plays like {Math.round(eff)} ft
            {read.elev !== 'flat' ? ` (${read.elev}hill)` : ''}
          </div>
        </div>

        {/* controls */}
        <Control label={`Length: ${read.lengthFt} ft`}>
          <input
            type="range" min={3} max={60} step={1} value={read.lengthFt}
            onChange={(e) => setRead({ ...read, lengthFt: Number(e.target.value) })}
            className="w-full accent-[#10b981]"
          />
        </Control>

        <Control label="Slope under your feet (AimPoint: feel it, don't see it)">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setRead({ ...read, slopePct: s })}
                className={`rounded-xl border py-2.5 text-center font-bold ${read.slopePct === s ? 'bg-accent text-[#04130d] border-accent' : 'bg-surface-2 border-line text-muted'}`}
              >
                {s}%
              </button>
            ))}
          </div>
        </Control>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Control label="Ball breaks…">
            <div className="grid grid-cols-2 gap-2">
              {(['L', 'R'] as BreakDir[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setRead({ ...read, dir: d })}
                  className={`rounded-xl border py-2.5 font-bold ${read.dir === d ? 'bg-accent text-[#04130d] border-accent' : 'bg-surface-2 border-line text-muted'}`}
                >
                  {d === 'L' ? '← Left' : 'Right →'}
                </button>
              ))}
            </div>
          </Control>
          <Control label="Uphill / downhill">
            <div className="grid grid-cols-3 gap-1.5">
              {(['up', 'flat', 'down'] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setRead({ ...read, elev: e })}
                  className={`rounded-xl border py-2.5 text-[12px] font-bold ${read.elev === e ? 'bg-accent text-[#04130d] border-accent' : 'bg-surface-2 border-line text-muted'}`}
                >
                  {e === 'up' ? '↗' : e === 'down' ? '↘' : '→'}
                </button>
              ))}
            </div>
          </Control>
        </div>

        <Control label={`Green speed: stimp ${read.stimp}`}>
          <div className="grid grid-cols-3 gap-2">
            {([['Slow', 8], ['Medium', 10], ['Fast', 12]] as const).map(([l, s]) => (
              <button
                key={s}
                onClick={() => setRead({ ...read, stimp: s })}
                className={`rounded-xl border py-2 text-[13px] font-semibold ${read.stimp === s ? 'bg-accent text-[#04130d] border-accent' : 'bg-surface-2 border-line text-muted'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </Control>

        <p className="text-[11px] text-faint mt-4 leading-relaxed">
          <span className="text-muted font-medium">How to feel slope:</span> straddle the line halfway to the hole.
          If one foot is clearly lower it's 2–3%; barely noticeable is 1%; you'd notice walking is 4%.
          Pace target: dying speed, 12–18″ past the cup.
        </p>
        <Button variant="secondary" className="w-full mt-3" onClick={onClose}>Done — over to you</Button>
      </div>
    </Sheet>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="text-[12px] font-medium text-muted mb-1.5">{label}</div>
      {children}
    </div>
  )
}

// ── Animated putt preview ───────────────────────────────────────────────

function PuttPreview({ read }: { read: Read }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startRef = useRef(0)

  useEffect(() => {
    startRef.current = performance.now()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0

    const draw = (now: number) => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * devicePixelRatio) {
        canvas.width = w * devicePixelRatio
        canvas.height = h * devicePixelRatio
      }
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

      // green background with subtle slope shading
      const grad = ctx.createLinearGradient(read.dir === 'R' ? 0 : w, 0, read.dir === 'R' ? w : 0, 0)
      grad.addColorStop(0, '#14532d')
      grad.addColorStop(1, '#166534')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      // mow lines
      ctx.fillStyle = 'rgba(255,255,255,0.025)'
      for (let i = 0; i < w; i += 26) ctx.fillRect(i, 0, 13, h)

      // slope arrows (downhill direction = break direction)
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      ctx.font = '11px sans-serif'
      for (let y = 18; y < h; y += 30) {
        ctx.fillText(read.dir === 'R' ? '→' : '←', read.dir === 'R' ? w - 22 : 10, y)
      }

      const bx = w / 2
      const by = h - 18
      const hx = w / 2
      const hy = 22
      const brkPx = Math.min(w * 0.34, breakInches(read) * 1.6) * (read.dir === 'R' ? 1 : -1)

      // ideal line: quadratic from ball to hole bowing into the slope (aim side)
      const cx = hx - brkPx * 1.45
      const cy = (by + hy) / 2

      // aim line (straight to apex direction)
      ctx.setLineDash([4, 6])
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.lineTo(hx - brkPx * 1.2, hy)
      ctx.stroke()
      ctx.setLineDash([])

      // breaking path
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.quadraticCurveTo(cx, cy, hx, hy)
      ctx.stroke()

      // hole
      ctx.fillStyle = '#0a0f0c'
      ctx.beginPath()
      ctx.ellipse(hx, hy, 7, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'
      ctx.lineWidth = 1
      ctx.stroke()
      // flag
      ctx.strokeStyle = '#e5e7eb'
      ctx.beginPath()
      ctx.moveTo(hx, hy - 2)
      ctx.lineTo(hx, hy - 26)
      ctx.stroke()
      ctx.fillStyle = '#f87171'
      ctx.beginPath()
      ctx.moveTo(hx, hy - 26)
      ctx.lineTo(hx + 13, hy - 21)
      ctx.lineTo(hx, hy - 16)
      ctx.fill()

      // rolling ball: ease-out progress, loops
      const dur = 2400 + read.lengthFt * 35
      const t = ((now - startRef.current) % (dur + 900)) / dur
      if (t <= 1) {
        const p = 1 - Math.pow(1 - Math.min(t, 1), 2.2) // decelerating roll
        const px = q(bx, cx, hx, p)
        const py = q(by, cy, hy, p)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(px, py, 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [read])

  return <canvas ref={canvasRef} className="w-full h-[200px] rounded-xl border border-line" />
}

const q = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b
