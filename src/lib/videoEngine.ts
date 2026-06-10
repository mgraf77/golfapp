/**
 * Video engine v2 — the rendering core for generated lessons.
 * Cinematic stage, eased golfer animation with club trail, and a library
 * of scene templates (title, stat, compare, flight, checklist) that
 * storyboards compose with custom narration.
 */

export interface Scene {
  caption: string
  narration: string
  minMs: number
  draw: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void
}

export interface Storyboard {
  title: string
  scenes: Scene[]
}

// ── palette ─────────────────────────────────────────────────────────────
export const INK = '#eef4f1'
export const ACCENT = '#34d399'
export const GOLD = '#fbbf24'
export const RED = '#f87171'
export const BLUE = '#60a5fa'
export const DIM = 'rgba(238,244,241,0.4)'

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.4)
export const loop = (t: number, times = 1) => (t * times) % 1
export const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// ── stage ───────────────────────────────────────────────────────────────

export function stage(ctx: CanvasRenderingContext2D, w: number, h: number, groundFrac = 0.82) {
  const gy = h * groundFrac
  const sky = ctx.createLinearGradient(0, 0, 0, gy)
  sky.addColorStop(0, '#101e26')
  sky.addColorStop(0.7, '#0d1a16')
  sky.addColorStop(1, '#0c1713')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, gy)
  // horizon glow
  const glow = ctx.createRadialGradient(w * 0.5, gy, 0, w * 0.5, gy, w * 0.7)
  glow.addColorStop(0, 'rgba(52,211,153,0.10)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, gy)
  // turf
  const turf = ctx.createLinearGradient(0, gy, 0, h)
  turf.addColorStop(0, '#11271c')
  turf.addColorStop(1, '#0a1410')
  ctx.fillStyle = turf
  ctx.fillRect(0, gy, w, h - gy)
  ctx.strokeStyle = 'rgba(52,211,153,0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, gy)
  ctx.lineTo(w, gy)
  ctx.stroke()
  // mow stripes
  ctx.fillStyle = 'rgba(255,255,255,0.02)'
  for (let i = -1; i < 8; i++) {
    ctx.beginPath()
    ctx.moveTo(w * (i / 6), gy)
    ctx.lineTo(w * (i / 6) + w * 0.1, h)
    ctx.lineTo(w * (i / 6) + w * 0.18, h)
    ctx.lineTo(w * (i / 6) + w * 0.06, gy)
    ctx.fill()
  }
  // vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.78)
  vig.addColorStop(0, 'transparent')
  vig.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

// ── text helpers ────────────────────────────────────────────────────────

export function label(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  color = INK, size = 14, weight = 700, align: CanvasTextAlign = 'center',
) {
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`
  ctx.textAlign = align
  ctx.fillText(text, x, y)
  ctx.textAlign = 'left'
}

export function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 13) {
  ctx.font = `700 ${size}px Inter, system-ui, sans-serif`
  const tw = ctx.measureText(text).width
  const pad = size * 0.85
  ctx.fillStyle = 'rgba(8,14,11,0.75)'
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  roundRect(ctx, x - tw / 2 - pad, y - size * 1.05, tw + pad * 2, size * 1.9, size)
  ctx.fill()
  ctx.stroke()
  label(ctx, text, x, y + size * 0.32, color, size)
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function wrapText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number,
  lh: number, color = INK, size = 14, weight = 600,
) {
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`
  ctx.textAlign = 'center'
  const words = text.split(' ')
  let line = ''
  let yy = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy)
      line = word
      yy += lh
    } else line = test
  }
  if (line) ctx.fillText(line, x, yy)
  ctx.textAlign = 'left'
}

export function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 3) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - 11 * Math.cos(a - 0.45), y2 - 11 * Math.sin(a - 0.45))
  ctx.lineTo(x2 - 11 * Math.cos(a + 0.45), y2 - 11 * Math.sin(a + 0.45))
  ctx.fill()
}

// ── golfer ──────────────────────────────────────────────────────────────

interface Pose {
  hands: [number, number]
  club: [number, number]
  hipX: number
  headX: number
  headY: number
}

// face-on, target to the viewer's right; units ≈ body height 110
const SWING: Pose[] = [
  { hands: [3, 45], club: [10, 1], hipX: 0, headX: 0, headY: 98 },
  { hands: [-22, 58], club: [-42, 38], hipX: -2, headX: -1, headY: 98 },
  { hands: [-26, 94], club: [-40, 118], hipX: -3, headX: -2, headY: 97 },
  { hands: [-6, 52], club: [-16, 14], hipX: 2, headX: -1, headY: 97 },
  { hands: [7, 44], club: [11, 1], hipX: 5, headX: 0, headY: 98 },
  { hands: [30, 70], club: [52, 58], hipX: 8, headX: 1, headY: 98 },
  { hands: [24, 98], club: [10, 122], hipX: 10, headX: 2, headY: 99 },
]
const TIMES = [0, 0.75, 1.5, 2.1, 2.5, 2.8, 3.5]

export function poseAt(phase: number, hipSwayExtra = 0): Pose {
  const p = Math.max(0, Math.min(3.5, phase))
  let i = 0
  while (i < TIMES.length - 2 && TIMES[i + 1] < p) i++
  const f = easeInOut((p - TIMES[i]) / (TIMES[i + 1] - TIMES[i] || 1))
  const a = SWING[i]
  const b = SWING[i + 1]
  const mix = (x: number, y: number) => x + (y - x) * f
  const swayBoost = hipSwayExtra * Math.sin(Math.min(p / 1.5, 1) * Math.PI * 0.5) * (p <= 1.8 ? 1 : 0.4)
  return {
    hands: [mix(a.hands[0], b.hands[0]), mix(a.hands[1], b.hands[1])],
    club: [mix(a.club[0], b.club[0]), mix(a.club[1], b.club[1])],
    hipX: mix(a.hipX, b.hipX) - swayBoost,
    headX: mix(a.headX, b.headX) - swayBoost * 0.7,
    headY: mix(a.headY, b.headY),
  }
}

export interface GolferOpts {
  color?: string
  hipSwayExtra?: number
  showBall?: boolean
  trail?: boolean
  glow?: boolean
  spineTiltExtra?: number
}

export function drawGolfer(
  ctx: CanvasRenderingContext2D, cx: number, groundY: number, scale: number,
  phase: number, opts: GolferOpts = {},
) {
  const { color = INK, hipSwayExtra = 0, showBall = true, trail = false, glow = false, spineTiltExtra = 0 } = opts
  const X = (x: number) => cx + x * scale
  const Y = (y: number) => groundY - y * scale

  // club trail — fading ghosts of recent clubhead positions
  if (trail && phase > 0.1) {
    const isDown = phase > 1.6
    for (let k = 1; k <= 7; k++) {
      const ghost = poseAt(phase - k * (isDown ? 0.05 : 0.09), hipSwayExtra)
      ctx.strokeStyle = `rgba(251,191,36,${0.30 - k * 0.038})`
      ctx.lineWidth = Math.max(1.5, 2.5 * scale - k * 0.2)
      ctx.beginPath()
      ctx.moveTo(X(ghost.hands[0]), Y(ghost.hands[1]))
      ctx.lineTo(X(ghost.club[0]), Y(ghost.club[1]))
      ctx.stroke()
    }
  }

  const P = poseAt(phase, hipSwayExtra)
  if (glow) {
    ctx.shadowColor = color
    ctx.shadowBlur = 14
  }
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(2.5, 3.6 * scale)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const shoulderX = P.headX + spineTiltExtra * 0.3
  // legs
  ctx.beginPath()
  ctx.moveTo(X(-14), Y(0))
  ctx.lineTo(X(P.hipX - 9), Y(52))
  ctx.lineTo(X(P.hipX + 9), Y(52))
  ctx.lineTo(X(14), Y(0))
  ctx.stroke()
  // spine
  ctx.beginPath()
  ctx.moveTo(X(P.hipX), Y(52))
  ctx.lineTo(X(shoulderX), Y(86))
  ctx.stroke()
  // head
  ctx.beginPath()
  ctx.arc(X(P.headX + spineTiltExtra * 0.45), Y(P.headY), 9 * scale, 0, Math.PI * 2)
  ctx.stroke()
  // arms
  ctx.beginPath()
  ctx.moveTo(X(shoulderX - 11), Y(84))
  ctx.lineTo(X(P.hands[0]), Y(P.hands[1]))
  ctx.moveTo(X(shoulderX + 11), Y(84))
  ctx.lineTo(X(P.hands[0]), Y(P.hands[1]))
  ctx.stroke()
  // club
  ctx.lineWidth = Math.max(2, 2.6 * scale)
  ctx.beginPath()
  ctx.moveTo(X(P.hands[0]), Y(P.hands[1]))
  ctx.lineTo(X(P.club[0]), Y(P.club[1]))
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(X(P.club[0]), Y(P.club[1]), 3.6 * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // impact flash
  if (phase > 2.42 && phase < 2.62) {
    const f = 1 - Math.abs(phase - 2.52) / 0.1
    ctx.fillStyle = `rgba(255,255,255,${0.5 * f})`
    ctx.beginPath()
    ctx.arc(X(10), Y(2), 11 * scale * (1 + f), 0, Math.PI * 2)
    ctx.fill()
  }
  if (showBall && phase < 2.5) {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(X(10), Y(2), 3.6 * scale, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Animated ball flight with comet trail. t 0..1; x0,y0 launch point. */
export function flight(
  ctx: CanvasRenderingContext2D, x0: number, y0: number, t: number, w: number,
  opts: { high?: boolean; color?: string; rangeFrac?: number; curve?: number } = {},
) {
  const { high = true, color = GOLD, rangeFrac = 0.5, curve = 0 } = opts
  const range = w * rangeFrac
  const apex = high ? 0.34 : 0.16
  const N = 56
  const pt = (u: number): [number, number] => [
    x0 + range * u + curve * w * u * u,
    y0 - Math.sin(u * Math.PI) * apex * w * 0.42,
  ]
  const progress = clamp01(t)
  // trail
  for (let i = 1; i <= Math.floor(N * progress); i++) {
    const u0 = (i - 1) / N
    const u1 = i / N
    const frac = i / (N * progress)
    ctx.strokeStyle = colorWithAlpha(color, 0.1 + frac * 0.85)
    ctx.lineWidth = 1.6 + frac * 2.2
    ctx.lineCap = 'round'
    const [ax, ay] = pt(u0)
    const [bx, by] = pt(u1)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }
  if (progress > 0 && progress < 1) {
    const [hx, hy] = pt(progress)
    ctx.fillStyle = '#fff'
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(hx, hy, 4.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

function colorWithAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ── scene templates ─────────────────────────────────────────────────────

/** Opening title card: big type, accent rule, slow swing silhouette. */
export function titleScene(title: string, kicker: string, narration: string): Scene {
  return {
    caption: title,
    narration,
    minMs: 5200,
    draw: (ctx, t, w, h) => {
      stage(ctx, w, h)
      drawGolfer(ctx, w * 0.5, h * 0.82, h / 175, loop(t, 0.9) * 3.5, {
        color: 'rgba(238,244,241,0.22)', trail: true, showBall: true,
      })
      const fade = clamp01(t * 4)
      ctx.globalAlpha = fade
      label(ctx, kicker.toUpperCase(), w / 2, h * 0.3, ACCENT, Math.min(13, w * 0.034), 800)
      wrapText(ctx, title, w / 2, h * 0.39, w * 0.84, Math.min(30, w * 0.075), INK, Math.min(26, w * 0.062), 800)
      ctx.fillStyle = ACCENT
      ctx.fillRect(w / 2 - 22 * fade, h * 0.46, 44 * fade, 3)
      ctx.globalAlpha = 1
    },
  }
}

/** Big animated stat: number counts up, context line below. */
export function statScene(stat: string, unit: string, context: string, narration: string, color = GOLD): Scene {
  const target = parseFloat(stat)
  const isNumeric = !Number.isNaN(target)
  return {
    caption: context,
    narration,
    minMs: 6000,
    draw: (ctx, t, w, h) => {
      stage(ctx, w, h)
      const k = easeOut(clamp01(t * 1.6))
      const shown = isNumeric
        ? (Number.isInteger(target) ? Math.round(target * k).toString() : (target * k).toFixed(1))
        : stat
      // ring
      ctx.strokeStyle = colorWithAlpha(color, 0.25)
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(w / 2, h * 0.38, Math.min(w, h) * 0.21, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.arc(w / 2, h * 0.38, Math.min(w, h) * 0.21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k)
      ctx.stroke()
      label(ctx, shown, w / 2, h * 0.39, INK, Math.min(44, w * 0.115), 800)
      label(ctx, unit, w / 2, h * 0.45, color, Math.min(14, w * 0.036), 700)
      wrapText(ctx, context, w / 2, h * 0.66, w * 0.8, Math.min(22, w * 0.052), DIM, Math.min(15, w * 0.038))
    },
  }
}

/** Side-by-side wrong vs right golfers. */
export function compareScene(
  caption: string, narration: string,
  badLabel: string, goodLabel: string,
  badOpts: GolferOpts, goodOpts: GolferOpts,
  phaseMax = 1.5,
): Scene {
  return {
    caption,
    narration,
    minMs: 8200,
    draw: (ctx, t, w, h) => {
      stage(ctx, w, h)
      const ph = loop(t, 2.2) * phaseMax
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.setLineDash([4, 8])
      ctx.beginPath()
      ctx.moveTo(w / 2, h * 0.12)
      ctx.lineTo(w / 2, h * 0.9)
      ctx.stroke()
      ctx.setLineDash([])
      drawGolfer(ctx, w * 0.27, h * 0.82, h / 195, ph, { color: RED, ...badOpts })
      drawGolfer(ctx, w * 0.73, h * 0.82, h / 195, ph, { color: ACCENT, ...goodOpts })
      pill(ctx, `✗ ${badLabel}`, w * 0.27, h * 0.13, RED, Math.min(12, w * 0.032))
      pill(ctx, `✓ ${goodLabel}`, w * 0.73, h * 0.13, ACCENT, Math.min(12, w * 0.032))
    },
  }
}

/** Animated checklist that ticks items one by one. */
export function checklistScene(caption: string, narration: string, items: string[], minMs = 8000): Scene {
  return {
    caption,
    narration,
    minMs,
    draw: (ctx, t, w, h) => {
      stage(ctx, w, h)
      drawGolfer(ctx, w * 0.5, h * 0.84, h / 230, 0, { color: 'rgba(238,244,241,0.18)' })
      const shown = Math.floor(easeOut(clamp01(t * 1.15)) * items.length * 0.999) + 1
      const size = Math.min(15, w * 0.038)
      const lh = size * 2.4
      const startY = h * 0.5 - (items.length - 1) * lh * 0.5
      items.forEach((item, i) => {
        const on = i < shown
        const y = startY + i * lh
        ctx.strokeStyle = on ? ACCENT : DIM
        ctx.lineWidth = 2
        roundRect(ctx, w * 0.1, y - size * 0.95, size * 1.5, size * 1.5, 5)
        ctx.stroke()
        if (on) {
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(w * 0.1 + size * 0.32, y - size * 0.2)
          ctx.lineTo(w * 0.1 + size * 0.65, y + size * 0.12)
          ctx.lineTo(w * 0.1 + size * 1.2, y - size * 0.62)
          ctx.stroke()
        }
        ctx.fillStyle = on ? INK : DIM
        ctx.font = `600 ${size}px Inter, system-ui, sans-serif`
        ctx.fillText(item, w * 0.1 + size * 2.2, y)
      })
    },
  }
}

/** Closing card: the one thought to take to the course. */
export function outroScene(thought: string, narration: string): Scene {
  return {
    caption: 'Your one thought',
    narration,
    minMs: 5200,
    draw: (ctx, t, w, h) => {
      stage(ctx, w, h)
      const ph = Math.min(3.5, easeInOut(clamp01(t * 1.2)) * 3.5)
      drawGolfer(ctx, w * 0.5, h * 0.8, h / 185, ph, { color: INK, trail: true, glow: ph > 2.3 && ph < 2.7 })
      if (ph > 2.5) flight(ctx, w * 0.54, h * 0.78, (ph - 2.5) * 1.4, w, { rangeFrac: 0.42 })
      label(ctx, 'ONE THOUGHT', w / 2, h * 0.14, ACCENT, Math.min(11, w * 0.03), 800)
      wrapText(ctx, `“${thought}”`, w / 2, h * 0.22, w * 0.84, Math.min(24, w * 0.058), GOLD, Math.min(19, w * 0.047), 700)
    },
  }
}
