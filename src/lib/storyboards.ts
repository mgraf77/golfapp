/**
 * AI video engine: every lesson gets a generated, narrated animation —
 * rendered live on canvas with Web-Speech voiceover. No video files, no
 * API costs, works offline once loaded.
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
const INK = '#e9efec'
const ACCENT = '#34d399'
const GOLD = '#fbbf24'
const RED = '#f87171'
const DIM = 'rgba(233,239,236,0.45)'

// ── primitives ──────────────────────────────────────────────────────────

function bg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#0e1a16')
  g.addColorStop(1, '#0a100e')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // ground
  ctx.strokeStyle = 'rgba(52,211,153,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, h * 0.82)
  ctx.lineTo(w, h * 0.82)
  ctx.stroke()
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = INK, size = 14, align: CanvasTextAlign = 'center') {
  ctx.fillStyle = color
  ctx.font = `700 ${size}px Inter, sans-serif`
  ctx.textAlign = align
  ctx.fillText(text, x, y)
  ctx.textAlign = 'left'
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 3) {
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

// ── stick golfer (face-on, target to the viewer's right) ───────────────

interface Pose {
  hands: [number, number]
  club: [number, number]
  hipX: number
  headX: number
}

// keyframes along the swing: address → top → impact → finish (phase 0..3)
const SWING: Pose[] = [
  { hands: [3, 45], club: [10, 1], hipX: 0, headX: 0 },     // 0 address
  { hands: [-22, 58], club: [-42, 38], hipX: -2, headX: -1 }, // 0.75 takeaway
  { hands: [-26, 94], club: [-40, 118], hipX: -3, headX: -2 }, // 1.5 top
  { hands: [-6, 52], club: [-16, 14], hipX: 2, headX: -1 },  // 2.1 transition
  { hands: [7, 44], club: [11, 1], hipX: 5, headX: 0 },      // 2.5 impact
  { hands: [30, 70], club: [52, 58], hipX: 8, headX: 1 },    // 2.8 release
  { hands: [24, 98], club: [10, 122], hipX: 10, headX: 2 },  // 3.5 finish
]
const SWING_TIMES = [0, 0.75, 1.5, 2.1, 2.5, 2.8, 3.5]

function poseAt(phase: number, hipSwayExtra = 0): Pose {
  const p = Math.max(0, Math.min(3.5, phase))
  let i = 0
  while (i < SWING_TIMES.length - 2 && SWING_TIMES[i + 1] < p) i++
  const f = (p - SWING_TIMES[i]) / (SWING_TIMES[i + 1] - SWING_TIMES[i] || 1)
  const a = SWING[i]
  const b = SWING[i + 1]
  const mix = (x: number, y: number) => x + (y - x) * f
  // sway: exaggerate hip drift during the backswing portion
  const swayBoost = hipSwayExtra * Math.sin(Math.min(p / 1.5, 1) * Math.PI * 0.5) * (p <= 1.8 ? 1 : 0.4)
  return {
    hands: [mix(a.hands[0], b.hands[0]), mix(a.hands[1], b.hands[1])],
    club: [mix(a.club[0], b.club[0]), mix(a.club[1], b.club[1])],
    hipX: mix(a.hipX, b.hipX) - swayBoost,
    headX: mix(a.headX, b.headX) - swayBoost * 0.7,
  }
}

export function drawGolfer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  scale: number,
  phase: number,
  opts: { color?: string; hipSwayExtra?: number; showBall?: boolean } = {},
) {
  const { color = INK, hipSwayExtra = 0, showBall = true } = opts
  const P = poseAt(phase, hipSwayExtra)
  const X = (x: number) => cx + x * scale
  const Y = (y: number) => groundY - y * scale

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(2.5, 3.5 * scale)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const hipL: [number, number] = [P.hipX - 9, 52]
  const hipR: [number, number] = [P.hipX + 9, 52]
  const shoulder: [number, number] = [P.headX, 86]

  // legs
  ctx.beginPath()
  ctx.moveTo(X(-14), Y(0))
  ctx.lineTo(X(hipL[0]), Y(hipL[1]))
  ctx.lineTo(X(hipR[0]), Y(hipR[1]))
  ctx.lineTo(X(14), Y(0))
  ctx.stroke()
  // spine
  ctx.beginPath()
  ctx.moveTo(X(P.hipX), Y(52))
  ctx.lineTo(X(shoulder[0]), Y(shoulder[1]))
  ctx.stroke()
  // head
  ctx.beginPath()
  ctx.arc(X(P.headX), Y(98), 9 * scale, 0, Math.PI * 2)
  ctx.stroke()
  // arms → hands
  ctx.beginPath()
  ctx.moveTo(X(shoulder[0] - 11), Y(shoulder[1] - 2))
  ctx.lineTo(X(P.hands[0]), Y(P.hands[1]))
  ctx.moveTo(X(shoulder[0] + 11), Y(shoulder[1] - 2))
  ctx.lineTo(X(P.hands[0]), Y(P.hands[1]))
  ctx.stroke()
  // club
  ctx.lineWidth = Math.max(2, 2.5 * scale)
  ctx.beginPath()
  ctx.moveTo(X(P.hands[0]), Y(P.hands[1]))
  ctx.lineTo(X(P.club[0]), Y(P.club[1]))
  ctx.stroke()
  // clubhead
  ctx.beginPath()
  ctx.arc(X(P.club[0]), Y(P.club[1]), 3.5 * scale, 0, Math.PI * 2)
  ctx.fill()
  // ball
  if (showBall && phase < 2.5) {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(X(10), Y(2), 3.5 * scale, 0, Math.PI * 2)
    ctx.fill()
  }
}

function flight(ctx: CanvasRenderingContext2D, x0: number, y0: number, t: number, w: number, opts: { high?: boolean; color?: string } = {}) {
  const { high = true, color = GOLD } = opts
  const range = w * 0.5
  const apex = high ? 0.32 : 0.16
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  const steps = Math.floor(40 * t)
  for (let i = 0; i <= steps; i++) {
    const u = i / 40
    const x = x0 + range * u
    const y = y0 - Math.sin(u * Math.PI) * apex * w * 0.4
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
  if (steps > 0 && steps < 40) {
    const u = steps / 40
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x0 + range * u, y0 - Math.sin(u * Math.PI) * apex * w * 0.4, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

const loop = (t: number, times = 1) => (t * times) % 1

// ── storyboards ─────────────────────────────────────────────────────────

const STORYBOARDS: Record<string, Storyboard> = {
  'rotation-engine': {
    title: 'Turn, don\'t sway',
    scenes: [
      {
        caption: 'The amateur power leak: sliding',
        narration: 'This is the most common power leak in golf. Watch the hips slide away from the target instead of turning. The low point wanders, and contact gets streaky.',
        minMs: 7000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const ph = loop(t, 2) * 1.5
          drawGolfer(ctx, w * 0.5, h * 0.82, h / 165, ph, { color: RED, hipSwayExtra: 14 })
          arrow(ctx, w * 0.5, h * 0.55, w * 0.32, h * 0.55, RED)
          label(ctx, 'hips SLIDE ✗', w * 0.5, h * 0.13, RED, 16)
        },
      },
      {
        caption: 'The fix: coil around a stable post',
        narration: 'Now the fix. The trail hip turns behind you while the head stays centered. Feel the trail glute hold its ground as the chest coils. Same backswing length, twice the stability.',
        minMs: 8000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const ph = loop(t, 2) * 1.5
          // stability wall
          ctx.strokeStyle = DIM
          ctx.setLineDash([6, 6])
          ctx.beginPath()
          ctx.moveTo(w * 0.5 - (h / 165) * 22, h * 0.2)
          ctx.lineTo(w * 0.5 - (h / 165) * 22, h * 0.82)
          ctx.stroke()
          ctx.setLineDash([])
          drawGolfer(ctx, w * 0.5, h * 0.82, h / 165, ph, { color: ACCENT, hipSwayExtra: 0 })
          label(ctx, 'hips TURN ✓ (wall drill)', w * 0.5, h * 0.13, ACCENT, 16)
        },
      },
      {
        caption: 'Full sequence: ground → hips → chest → club',
        narration: 'Put it together. Pressure shifts to the lead foot first, hips open, chest follows, the club arrives last. That order is where free speed lives.',
        minMs: 8000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const ph = loop(t, 1.5) * 3.5
          drawGolfer(ctx, w * 0.42, h * 0.82, h / 165, ph, { color: INK })
          if (ph > 2.5) flight(ctx, w * 0.46, h * 0.8, (ph - 2.5) / 1, w)
          const seq = ['GROUND', 'HIPS', 'CHEST', 'CLUB']
          seq.forEach((s, i) => {
            const active = ph > 1.5 + i * 0.3 && ph < 3.4
            label(ctx, s, w * (0.2 + i * 0.2), h * 0.94, active ? ACCENT : DIM, 12)
          })
        },
      },
    ],
  },

  'iron-compression': {
    title: 'Compress your irons',
    scenes: [
      {
        caption: 'Where the swing bottoms out decides everything',
        narration: 'Every swing has a low point. Strike the ball before it, and you compress it. Bottom out behind it, and you get fat or thin — nothing in between.',
        minMs: 8000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          // arc
          ctx.strokeStyle = DIM
          ctx.setLineDash([5, 6])
          ctx.beginPath()
          ctx.arc(w * 0.5, h * 0.1, h * 0.72, Math.PI * 0.32, Math.PI * 0.68)
          ctx.stroke()
          ctx.setLineDash([])
          const bx = w * 0.46
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(bx, h * 0.8, 6, 0, Math.PI * 2)
          ctx.fill()
          // low point marker AFTER ball
          const lx = w * 0.56
          arrow(ctx, lx, h * 0.62, lx, h * 0.79, ACCENT)
          label(ctx, 'low point', lx, h * 0.58, ACCENT, 13)
          label(ctx, 'ball', bx, h * 0.92, INK, 13)
          // divot
          const dv = Math.min(1, loop(t, 1.6) * 2)
          ctx.fillStyle = 'rgba(180,120,60,0.6)'
          ctx.fillRect(bx + 8, h * 0.815, 38 * dv, 5)
          label(ctx, 'divot AFTER the ball ✓', w * 0.5, h * 0.13, GOLD, 15)
        },
      },
      {
        caption: 'Shaft lean + forward pressure',
        narration: 'At impact, hands lead the clubhead and eighty percent of your pressure is on the lead foot. Hit down. The loft does the lifting — you never have to.',
        minMs: 8000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const ph = 2.0 + loop(t, 2) * 0.5 // transition → impact loop
          drawGolfer(ctx, w * 0.5, h * 0.82, h / 165, ph, { color: INK })
          arrow(ctx, w * 0.5, h * 0.9, w * 0.6, h * 0.9, ACCENT)
          label(ctx, '80% lead side', w * 0.55, h * 0.97, ACCENT, 12)
          label(ctx, 'hands ahead, ball first', w * 0.5, h * 0.13, GOLD, 15)
        },
      },
      {
        caption: 'Drill: towel behind the ball',
        narration: 'Lay a towel one grip length behind the ball and hit half shots without touching it. Your body learns the forward strike without a single swing thought.',
        minMs: 7000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const ph = loop(t, 1.6) * 3.5
          drawGolfer(ctx, w * 0.45, h * 0.82, h / 165, ph, { color: INK })
          // towel
          ctx.fillStyle = '#60a5fa'
          ctx.fillRect(w * 0.45 + (h / 165) * 24, h * 0.8, 34, 7)
          label(ctx, 'towel — don\'t touch it', w * 0.62, h * 0.74, '#60a5fa', 12)
          if (ph > 2.5) flight(ctx, w * 0.5, h * 0.8, (ph - 2.5), w)
        },
      },
    ],
  },

  'wedge-clock': {
    title: 'The clock system',
    scenes: [
      {
        caption: 'Three backswing lengths = nine stock numbers',
        narration: 'Picture a clock face. Swing the lead arm to nine o\'clock, ten thirty, or a full eleven — same tempo every time. Three lengths across three wedges gives you nine exact carry numbers.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const positions = [
            { p: 0.9, lbl: '9:00 — 52 yds', col: ACCENT },
            { p: 1.2, lbl: '10:30 — 68 yds', col: GOLD },
            { p: 1.5, lbl: 'Full — 85 yds', col: RED },
          ]
          const seg = Math.floor(loop(t, 1) * 3) % 3
          const pos = positions[seg]
          drawGolfer(ctx, w * 0.5, h * 0.84, h / 175, pos.p, { color: INK })
          // clock arc
          ctx.strokeStyle = DIM
          ctx.setLineDash([3, 5])
          ctx.beginPath()
          ctx.arc(w * 0.5, h * 0.45, h * 0.33, Math.PI * 0.5, Math.PI * 1.5)
          ctx.stroke()
          ctx.setLineDash([])
          label(ctx, pos.lbl, w * 0.5, h * 0.12, pos.col, 17)
        },
      },
      {
        caption: 'Short backswing, FULL commitment',
        narration: 'The nine o\'clock shot is a shorter swing, never a slower one. Deceleration is the number one wedge killer. Short back — aggressive turn through.',
        minMs: 7000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const ph = loop(t, 2)
          const phase = ph < 0.5 ? ph * 1.8 : 0.9 + (ph - 0.5) * 4.2 // slow back, fast through
          drawGolfer(ctx, w * 0.45, h * 0.82, h / 165, Math.min(phase, 3.4), { color: ACCENT })
          if (phase > 2.5) flight(ctx, w * 0.5, h * 0.8, phase - 2.5, w, { high: true })
          label(ctx, 'smooth back · COMMIT through', w * 0.5, h * 0.12, GOLD, 15)
        },
      },
    ],
  },

  'putting-speed': {
    title: 'Speed is 90% of putting',
    scenes: [
      {
        caption: 'Same tempo, longer stroke',
        narration: 'Distance comes from the length of the stroke, not the hit. The pendulum swings at the same beat whether the putt is six feet or forty.',
        minMs: 7500,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const a = Math.sin(loop(t, 3) * Math.PI * 2) // pendulum
          const px = w * 0.3
          const py = h * 0.35
          ctx.strokeStyle = INK
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px + a * 60, py + h * 0.38)
          ctx.stroke()
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(px + a * 60, py + h * 0.38, 6, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, 'one — two · one — two', px, h * 0.2, ACCENT, 15)
          // rolling ball
          const roll = Math.max(0, a) * (w * 0.42)
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(px + 30 + roll, h * 0.82 - 5, 5, 0, Math.PI * 2)
          ctx.fill()
        },
      },
      {
        caption: 'Die it in: 12–18″ past, never charging',
        narration: 'A putt dying at the hole can fall in from any edge — a charging putt only has the dead center. Aim to finish a foot past the cup, no more.',
        minMs: 8000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const hx = w * 0.78
          const hy = h * 0.5
          // hole
          ctx.fillStyle = '#0a0f0c'
          ctx.beginPath()
          ctx.ellipse(hx, hy, 10, 7, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = DIM
          ctx.stroke()
          // good putt (dies just past)
          const t1 = Math.min(1, loop(t, 1.4) * 1.3)
          const ease = 1 - Math.pow(1 - t1, 2.4)
          ctx.fillStyle = ACCENT
          ctx.beginPath()
          ctx.arc(w * 0.12 + ease * (hx - w * 0.12 + 14), hy - 26, 5.5, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, 'dying speed ✓ whole cup plays', w * 0.45, hy - 44, ACCENT, 13)
          // bad putt (races by)
          const t2 = Math.min(1, loop(t, 1.4) * 1.05)
          ctx.fillStyle = RED
          ctx.beginPath()
          ctx.arc(w * 0.12 + t2 * (w * 0.86), hy + 30, 5.5, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, 'charging ✗ lip-out city, 4 ft coming back', w * 0.45, hy + 56, RED, 13)
        },
      },
    ],
  },

  'driver-launch': {
    title: 'Driver: hit up on it',
    scenes: [
      {
        caption: 'Setup presets the launch',
        narration: 'Ball off the lead heel, spine tilted slightly away from the target. The driver is the only club you strike on the way up.',
        minMs: 7000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          drawGolfer(ctx, w * 0.45, h * 0.82, h / 165, 0, { color: INK, showBall: false })
          // teed ball forward
          ctx.strokeStyle = DIM
          ctx.beginPath()
          ctx.moveTo(w * 0.45 + (h / 165) * 16, h * 0.82)
          ctx.lineTo(w * 0.45 + (h / 165) * 16, h * 0.79)
          ctx.stroke()
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(w * 0.45 + (h / 165) * 16, h * 0.78, 4.5, 0, Math.PI * 2)
          ctx.fill()
          arrow(ctx, w * 0.32, h * 0.5, w * 0.29, h * 0.62, GOLD)
          label(ctx, 'spine tilts away', w * 0.27, h * 0.46, GOLD, 12)
          arrow(ctx, w * 0.52, h * 0.8, w * 0.62, h * 0.7, ACCENT)
          label(ctx, 'strike UP', w * 0.62, h * 0.66, ACCENT, 13)
        },
      },
      {
        caption: 'High launch, low spin = free distance',
        narration: 'Hitting up launches it high with less spin — that\'s fifteen to twenty five free yards. Hitting down adds spin, the ball balloons and bends. Same swing speed, very different drives.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const tt = loop(t, 1.3)
          // good: high launch
          flight(ctx, w * 0.08, h * 0.82, tt, w * 1.35, { high: true, color: ACCENT })
          // bad: ballooning slice-y
          ctx.strokeStyle = RED
          ctx.lineWidth = 2.5
          ctx.beginPath()
          const steps = Math.floor(40 * tt)
          for (let i = 0; i <= steps; i++) {
            const u = i / 40
            const x = w * 0.08 + w * 0.5 * u
            const y = h * 0.82 - Math.sin(Math.min(u * 1.4, 1) * Math.PI) * 0.34 * h - u * u * 18
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.stroke()
          label(ctx, 'up-strike ✓', w * 0.78, h * 0.5, ACCENT, 14)
          label(ctx, 'down-strike: balloons ✗', w * 0.42, h * 0.3, RED, 13)
        },
      },
    ],
  },

  'course-iq': {
    title: 'Play the percentages',
    scenes: [
      {
        caption: 'Your shots land in an ellipse, not a point',
        narration: 'You don\'t hit a shot — you hit a pattern. The question is never can I pull this off. It\'s: where does the whole ellipse go?',
        minMs: 7500,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          // green + water
          ctx.fillStyle = 'rgba(16,185,129,0.25)'
          ctx.beginPath()
          ctx.ellipse(w * 0.62, h * 0.45, w * 0.16, h * 0.2, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(14,165,233,0.4)'
          ctx.beginPath()
          ctx.ellipse(w * 0.85, h * 0.5, w * 0.1, h * 0.26, 0, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, 'water', w * 0.85, h * 0.5, '#7dd3fc', 12)
          // pin tucked right
          label(ctx, '⛳', w * 0.72, h * 0.46, INK, 16)
          // ellipse over pin → overlaps water
          ctx.strokeStyle = RED
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.ellipse(w * 0.72, h * 0.45, w * 0.14, h * 0.17, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
          // sample dots
          const n = Math.floor(loop(t, 1) * 24)
          for (let i = 0; i < n; i++) {
            const a = (i * 137.5 * Math.PI) / 180
            const r = Math.sqrt((i + 1) / 24)
            const x = w * 0.72 + Math.cos(a) * r * w * 0.13
            const y = h * 0.45 + Math.sin(a) * r * h * 0.15
            ctx.fillStyle = x > w * 0.76 ? RED : INK
            ctx.beginPath()
            ctx.arc(x, y, 3, 0, Math.PI * 2)
            ctx.fill()
          }
          label(ctx, 'pin-hunting: 1 in 4 is wet', w * 0.5, h * 0.88, RED, 14)
        },
      },
      {
        caption: 'Move the target, keep the swing',
        narration: 'Shift the same ellipse to the fat side of the green and the water disappears from the pattern. You didn\'t get better — you got smarter. That\'s four to six strokes a round, free.',
        minMs: 8500,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          ctx.fillStyle = 'rgba(16,185,129,0.25)'
          ctx.beginPath()
          ctx.ellipse(w * 0.62, h * 0.45, w * 0.16, h * 0.2, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(14,165,233,0.4)'
          ctx.beginPath()
          ctx.ellipse(w * 0.85, h * 0.5, w * 0.1, h * 0.26, 0, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, '⛳', w * 0.72, h * 0.46, DIM, 16)
          ctx.strokeStyle = ACCENT
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.ellipse(w * 0.58, h * 0.45, w * 0.14, h * 0.17, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
          const n = Math.floor(loop(t, 1) * 24)
          for (let i = 0; i < n; i++) {
            const a = (i * 137.5 * Math.PI) / 180
            const r = Math.sqrt((i + 1) / 24)
            ctx.fillStyle = ACCENT
            ctx.beginPath()
            ctx.arc(w * 0.58 + Math.cos(a) * r * w * 0.13, h * 0.45 + Math.sin(a) * r * h * 0.15, 3, 0, Math.PI * 2)
            ctx.fill()
          }
          label(ctx, 'center-green: zero wet, 30 ft average putt', w * 0.5, h * 0.88, ACCENT, 14)
        },
      },
    ],
  },

  'wind-play': {
    title: 'Flight it, don\'t fight it',
    scenes: [
      {
        caption: 'Hard swings into wind = ballooning spin',
        narration: 'Into the breeze, a hard swing adds backspin. Spin climbs, climbing balls stall, and you come up two clubs short. Wind punishes effort.',
        minMs: 7500,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          for (let i = 0; i < 4; i++) {
            arrow(ctx, w * (0.85 - i * 0.02), h * (0.22 + i * 0.12), w * (0.7 - i * 0.02), h * (0.22 + i * 0.12), 'rgba(96,165,250,0.5)', 2)
          }
          const tt = loop(t, 1.4)
          ctx.strokeStyle = RED
          ctx.lineWidth = 2.5
          ctx.beginPath()
          const steps = Math.floor(40 * tt)
          for (let i = 0; i <= steps; i++) {
            const u = i / 40
            const x = w * 0.08 + w * 0.55 * Math.min(u * 1.2, 1) * (1 - u * 0.25)
            const y = h * 0.82 - Math.sin(Math.min(u * 1.3, 1) * Math.PI) * 0.4 * h
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.stroke()
          label(ctx, 'full swing: balloons & stalls ✗', w * 0.45, h * 0.2, RED, 14)
        },
      },
      {
        caption: 'The knockdown: 2 clubs more, 80% swing',
        narration: 'Take two extra clubs, grip down an inch, ball back, swing at eighty percent and finish low. The ball bores under the wind. This one shot saves three strokes on a windy day.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          for (let i = 0; i < 4; i++) {
            arrow(ctx, w * (0.85 - i * 0.02), h * (0.2 + i * 0.11), w * (0.7 - i * 0.02), h * (0.2 + i * 0.11), 'rgba(96,165,250,0.5)', 2)
          }
          const tt = loop(t, 1.4)
          flight(ctx, w * 0.08, h * 0.82, tt, w * 1.5, { high: false, color: ACCENT })
          label(ctx, 'knockdown: bores through ✓', w * 0.45, h * 0.5, ACCENT, 14)
          label(ctx, 'ball back · grip down · 80% · finish low', w * 0.5, h * 0.93, GOLD, 13)
        },
      },
    ],
  },

  'pressure-protocol': {
    title: 'The pressure protocol',
    scenes: [
      {
        caption: 'Pressure breaks routines, not swings',
        narration: 'Under pressure your swing doesn\'t leave — your routine does. Build one that runs on autopilot: smallest possible target, one rehearsal, one look, go. Under twelve seconds.',
        minMs: 8500,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const steps = ['TARGET', 'REHEARSE', 'ONE LOOK', 'GO']
          const active = Math.floor(loop(t, 1) * 4.99)
          steps.forEach((s, i) => {
            const x = w * (0.15 + i * 0.235)
            const on = i <= active
            ctx.strokeStyle = on ? ACCENT : DIM
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(x, h * 0.45, 26, 0, Math.PI * 2)
            ctx.stroke()
            label(ctx, `${i + 1}`, x, h * 0.47, on ? ACCENT : DIM, 16)
            label(ctx, s, x, h * 0.62, on ? INK : DIM, 11)
          })
          label(ctx, '< 12 seconds, every shot, forever', w * 0.5, h * 0.85, GOLD, 14)
        },
      },
      {
        caption: 'Exhale on the takeaway',
        narration: 'Long breath out as the club starts back. You cannot be fully tense on an exhale — it\'s physiology, not psychology. And after a bad one: ten steps of anger, then it\'s just data.',
        minMs: 8500,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const breathe = (Math.sin(loop(t, 2) * Math.PI * 2 - Math.PI / 2) + 1) / 2
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(w * 0.5, h * 0.45, 30 + breathe * 38, 0, Math.PI * 2)
          ctx.stroke()
          ctx.strokeStyle = 'rgba(52,211,153,0.25)'
          ctx.beginPath()
          ctx.arc(w * 0.5, h * 0.45, 30 + breathe * 58, 0, Math.PI * 2)
          ctx.stroke()
          label(ctx, breathe > 0.5 ? 'breathe in…' : 'long exhale — takeaway', w * 0.5, h * 0.85, INK, 15)
        },
      },
    ],
  },

  'grip-foundation': {
    title: 'The grip',
    scenes: [
      {
        caption: 'Club in the fingers, knuckles visible',
        narration: 'Lay the grip from the base of the pinky to the middle of the index finger. Close the hand and you should see two to three knuckles. In the palm, you lose the release. In the fingers, the club squares itself.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          // grip diagonal across a simplified hand
          ctx.strokeStyle = DIM
          ctx.lineWidth = 18
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(w * 0.2, h * 0.7)
          ctx.lineTo(w * 0.8, h * 0.3)
          ctx.stroke()
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 3
          // finger line
          ctx.setLineDash([7, 6])
          ctx.beginPath()
          ctx.moveTo(w * 0.3, h * 0.72)
          ctx.lineTo(w * 0.72, h * 0.42)
          ctx.stroke()
          ctx.setLineDash([])
          label(ctx, 'diagonal: base of pinky → middle of index', w * 0.5, h * 0.86, ACCENT, 13)
          const k = Math.floor(loop(t, 1) * 3.99)
          label(ctx, `${Math.min(k + 1, 3)} knuckles visible ✓`, w * 0.5, h * 0.14, GOLD, 15)
        },
      },
      {
        caption: 'Vs point at the trail shoulder · pressure 4/10',
        narration: 'The creases between thumbs and index fingers point between your trail ear and shoulder. Hold it like a tube of toothpaste with no cap. Tension in the hands is a handbrake on speed.',
        minMs: 8000,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          drawGolfer(ctx, w * 0.5, h * 0.84, h / 175, 0, { color: INK })
          arrow(ctx, w * 0.5, h * 0.62, w * 0.43, h * 0.36, GOLD)
          label(ctx, 'Vs → trail shoulder', w * 0.32, h * 0.3, GOLD, 13)
          const p = (Math.sin(loop(t, 2) * Math.PI * 2) + 1) / 2
          label(ctx, `grip pressure: ${p > 0.6 ? '4/10 ✓' : 'soft hands'}`, w * 0.5, h * 0.95, ACCENT, 13)
        },
      },
    ],
  },

  'greenside-system': {
    title: 'One chip, four trajectories',
    scenes: [
      {
        caption: 'Change the setup, never the swing',
        narration: 'One motion. Ball back means low with release. Ball forward with the face open means high and soft. The swing never changes — only the setup dial.',
        minMs: 8500,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          const mode = Math.floor(loop(t, 1) * 1.99)
          const tt = (loop(t, 1) * 2) % 1
          if (mode === 0) {
            // low runner
            ctx.strokeStyle = GOLD
            ctx.lineWidth = 2.5
            ctx.beginPath()
            const steps = Math.floor(40 * tt)
            for (let i = 0; i <= steps; i++) {
              const u = i / 40
              const x = w * 0.15 + w * 0.32 * Math.min(u * 2, 1)
              const fly = Math.sin(Math.min(u * 2, 1) * Math.PI) * 0.1 * h
              const roll = u > 0.5 ? 0 : 0
              const y = h * 0.8 - (u <= 0.5 ? fly : 0) - roll
              i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            }
            // rollout
            if (tt > 0.5) {
              const ru = (tt - 0.5) * 2
              ctx.lineTo(w * 0.47 + ru * w * 0.33, h * 0.8)
            }
            ctx.stroke()
            label(ctx, 'ball BACK: ⅓ fly, ⅔ roll', w * 0.5, h * 0.16, GOLD, 15)
          } else {
            flight(ctx, w * 0.15, h * 0.8, tt, w * 0.75, { high: true, color: ACCENT })
            label(ctx, 'ball UP + face open: floats, stops', w * 0.5, h * 0.16, ACCENT, 15)
          }
          label(ctx, '⛳', w * 0.82, h * 0.78, INK, 18)
        },
      },
      {
        caption: 'Pick the landing spot first',
        narration: 'Pros pick where the ball lands before they pick the club. Find the flat spot two paces onto the green, land it there every time, and let the club choose the rollout.',
        minMs: 7500,
        draw: (ctx, t, w, h) => {
          bg(ctx, w, h)
          // landing circle pulse
          const p = loop(t, 2)
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(w * 0.55, h * 0.78, 12 + p * 10, 0, Math.PI * 2)
          ctx.stroke()
          label(ctx, 'land HERE', w * 0.55, h * 0.65, ACCENT, 13)
          label(ctx, '⛳', w * 0.82, h * 0.76, INK, 18)
          flight(ctx, w * 0.15, h * 0.8, Math.min(1, loop(t, 2) * 1.4), w * 0.8, { high: true, color: GOLD })
        },
      },
    ],
  },
}

/** Generic storyboard for lessons without a custom one. */
function genericStoryboard(title: string, keys: string[], summary: string): Storyboard {
  const scenes: Scene[] = [
    {
      caption: title,
      narration: summary,
      minMs: 5500,
      draw: (ctx, t, w, h) => {
        bg(ctx, w, h)
        drawGolfer(ctx, w * 0.5, h * 0.82, h / 165, loop(t, 1.4) * 3.5, { color: INK })
      },
    },
    ...keys.slice(0, 4).map((k, i) => ({
      caption: k,
      narration: k,
      minMs: 4200,
      draw: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => {
        bg(ctx, w, h)
        drawGolfer(ctx, w * 0.32, h * 0.84, h / 190, loop(t, 1.4) * 3.5, { color: i % 2 ? ACCENT : INK })
        label(ctx, `Key ${i + 1}`, w * 0.66, h * 0.3, GOLD, 13)
        wrapText(ctx, k, w * 0.66, h * 0.38, w * 0.42, 16)
      },
    })),
  ]
  return { title, scenes }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  ctx.fillStyle = INK
  ctx.font = '600 13px Inter, sans-serif'
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

export function getStoryboard(lessonId: string, title: string, keys: string[], summary: string): Storyboard {
  return STORYBOARDS[lessonId] ?? genericStoryboard(title, keys, summary)
}

export function hasCustomVideo(lessonId: string): boolean {
  return lessonId in STORYBOARDS
}
