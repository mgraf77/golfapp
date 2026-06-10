import {
  ACCENT, BLUE, DIM, GOLD, INK, RED,
  type Scene, type Storyboard,
  arrow, checklistScene, clamp01, compareScene, drawGolfer, easeOut, flight,
  label, loop, outroScene, pill, roundRect, stage, statScene, titleScene, wrapText,
} from './videoEngine'

/**
 * One generated, narrated video per lesson. Scenes compose the engine's
 * templates (title / stat / compare / checklist / outro) with bespoke
 * animation where the concept needs it.
 */

const BOARDS: Record<string, Storyboard> = {
  // ── GRIP ──────────────────────────────────────────────────────────────
  'grip-foundation': {
    title: 'The grip: your only connection',
    scenes: [
      titleScene('The grip: your only connection', 'Full swing · foundation',
        'Ben Hogan spent a quarter of his famous book on the grip alone — before a single word about the swing. Here\'s why your ball flight is decided before you ever move the club.'),
      statScene('80', '% of start direction', 'comes from the clubface — and your grip owns the face',
        'Launch data shows the clubface controls roughly eighty percent of where the ball starts. An open face at impact is the number one amateur fault, and a weak grip almost guarantees one.'),
      {
        caption: 'Diagonal through the fingers — never the palm',
        narration: 'Lay the grip diagonally, from the base of the pinky to the middle joint of the index finger. Close the hand so the heel pad rides on top. You should see two to three knuckles, and both Vs point at your trail shoulder.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          ctx.strokeStyle = 'rgba(238,244,241,0.3)'
          ctx.lineWidth = Math.min(22, w * 0.05)
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(w * 0.18, h * 0.66)
          ctx.lineTo(w * 0.82, h * 0.3)
          ctx.stroke()
          const k = easeOut(clamp01(t * 1.6))
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 3.5
          ctx.setLineDash([8, 7])
          ctx.beginPath()
          ctx.moveTo(w * 0.26, h * 0.68)
          ctx.lineTo(w * 0.26 + (w * 0.46) * k, h * 0.68 - h * 0.26 * k)
          ctx.stroke()
          ctx.setLineDash([])
          pill(ctx, 'base of pinky → middle of index', w * 0.5, h * 0.84, ACCENT, Math.min(12, w * 0.032))
          const kn = Math.min(3, Math.floor(loop(t, 1) * 4))
          label(ctx, `${Math.max(1, kn)} knuckles visible ✓`, w * 0.5, h * 0.15, GOLD, Math.min(16, w * 0.042))
        },
      },
      checklistScene('Grip checkpoints', 'Run these four checks every time you pick up a club, for two weeks. Around three hundred reps, the new grip stops feeling strange — and the slice starts dying.',
        ['2–3 knuckles on the lead hand', 'Both Vs → trail shoulder', 'Heel pad ON TOP of the grip', 'Pressure 4 out of 10']),
      outroScene('Hold it like a bird — firm enough to keep it, soft enough not to hurt it',
        'Harvey Penick said hold the club like a small bird. Soft hands, correct angles, and the face squares itself — no timing required. That\'s the whole secret.'),
    ],
  },

  // ── SETUP ─────────────────────────────────────────────────────────────
  'setup-posture': {
    title: 'Setup: the swing before the swing',
    scenes: [
      titleScene('Setup: the swing before the swing', 'Full swing · foundation',
        'Setup is the only part of golf with no moving parts — which means anyone can do it tour-perfectly. Most swing flaws you fight are setup flaws playing out downstream.'),
      compareScene('Posture: slumped vs athletic', 'On the left, the C-posture: rounded back, chin buried, arms jammed. On the right: hinged from the hips, flat back, arms hanging free under the shoulders. The turn needs a tunnel — give it one.',
        'C-posture', 'hip hinge', { spineTiltExtra: -8 }, {}, 0.001),
      {
        caption: 'Railroad tracks: face at the target, body parallel',
        narration: 'Aim the clubface first, at a spot one foot ahead of the ball. Then build your feet, hips and shoulders parallel — like railroad tracks. Your body never aims at the target. The face does.',
        minMs: 8500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.9)
          const k = easeOut(clamp01(t * 1.4))
          // target line
          ctx.strokeStyle = GOLD
          ctx.setLineDash([10, 8])
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(w * 0.18, h * 0.62)
          ctx.lineTo(w * 0.18 + w * 0.68 * k, h * 0.62 - h * 0.34 * k)
          ctx.stroke()
          // body line
          ctx.strokeStyle = ACCENT
          ctx.beginPath()
          ctx.moveTo(w * 0.12, h * 0.76)
          ctx.lineTo(w * 0.12 + w * 0.68 * k, h * 0.76 - h * 0.34 * k)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(w * 0.18, h * 0.62, 5, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, '⛳', w * 0.86, h * 0.27, INK, Math.min(20, w * 0.05))
          pill(ctx, 'ball → target', w * 0.55, h * 0.36, GOLD, Math.min(11, w * 0.03))
          pill(ctx, 'feet · hips · shoulders', w * 0.42, h * 0.66, ACCENT, Math.min(11, w * 0.03))
          // intermediate spot
          const blink = loop(t, 4) > 0.5
          if (blink) {
            ctx.fillStyle = GOLD
            ctx.beginPath()
            ctx.arc(w * 0.27, h * 0.575, 4, 0, Math.PI * 2)
            ctx.fill()
            label(ctx, 'spot 1 ft ahead', w * 0.27, h * 0.51, GOLD, Math.min(11, w * 0.028))
          }
        },
      },
      checklistScene('The 10-second build', 'Same order, every shot: spot, face, stance, posture, waggle. Run it on every range ball — a routine you only use on the course isn\'t a routine, it\'s a costume.',
        ['Intermediate spot picked', 'Face aimed FIRST', 'Body parallel — railroad tracks', 'Arms hang plumb, weight on the balls']),
      outroScene('Face first, body second', 'Aim the face at your spot, build the body around it, and half your "swing problems" never show up. Setup is free strokes — collect them.'),
    ],
  },

  // ── ROTATION ──────────────────────────────────────────────────────────
  'rotation-engine': {
    title: 'Turn, don\'t sway',
    scenes: [
      titleScene('Turn, don\'t sway', 'Full swing · power & contact',
        'Amateurs slide. Tour players rotate. This is the difference between guessing where the bottom of your swing is — and knowing.'),
      statScene('4', '× more sway', 'high handicappers drift off the ball vs tour players',
        'Motion-capture studies show high handicappers sway off the ball up to four times more than tour players. Every inch of slide moves your low point an inch — and that is the entire story of fat and thin contact.'),
      compareScene('Slide vs coil', 'Left: the hips slide away from the target and the head drifts with them — power leaks, low point wanders. Right: the hips turn around a posted trail leg. Same backswing, twice the stability.',
        'hips slide', 'hips turn', { hipSwayExtra: 14 }, { hipSwayExtra: 0, trail: true }),
      {
        caption: 'The sequence: ground → hips → chest → arms → club',
        narration: 'Watch the order. Pressure smashes into the lead foot first, hips open, chest follows, arms drop, club arrives last — cracking like a whip. Every long hitter on earth, identical order.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          const ph = loop(t, 1.4) * 3.5
          drawGolfer(ctx, w * 0.42, h * 0.82, h / 175, ph, { color: INK, trail: true })
          if (ph > 2.5) flight(ctx, w * 0.46, h * 0.8, (ph - 2.5) * 1.2, w, { rangeFrac: 0.45 })
          const seq = ['GROUND', 'HIPS', 'CHEST', 'ARMS', 'CLUB']
          seq.forEach((s, i) => {
            const on = ph > 1.5 + i * 0.22 && ph < 3.4
            label(ctx, s, w * (0.12 + i * 0.19), h * 0.94, on ? ACCENT : DIM, Math.min(12, w * 0.03), on ? 800 : 600)
          })
        },
      },
      checklistScene('Pivot checkpoints', 'Film yourself in the Swing Studio — it measures your hip sway directly. Under fifteen percent of hip width is tour grade.',
        ['Trail knee keeps its flex', 'Head drifts < 1 ball-width', 'Lead shoulder behind the ball', 'Finish held 3 full seconds']),
      outroScene('Turn into the wall, not along it', 'Coil around the trail hip like a screw, not a slide. The low point stops wandering, and so does your contact.'),
    ],
  },

  // ── TEMPO ─────────────────────────────────────────────────────────────
  'tempo-transition': {
    title: 'Tempo: the 3-to-1 fingerprint',
    scenes: [
      titleScene('The 3-to-1 fingerprint', 'Full swing · tempo',
        'Researchers measured tour swings frame by frame and found something eerie: fast or slow, nearly every elite player swings at the same ratio. Three counts back. One count down.'),
      {
        caption: 'Count it: one — two — three… ONE',
        narration: 'Three counts to the top, one count to impact. Most amateurs are closer to two to one, because the transition panics. Watch the counter — speed lives at the ball, never at the top.',
        minMs: 9500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          const cycle = loop(t, 1.6)
          // 3:1 — backswing 0..0.75 of cycle, down 0.75..1
          const ph = cycle < 0.75 ? (cycle / 0.75) * 1.5 : 1.5 + ((cycle - 0.75) / 0.25) * 1.0
          drawGolfer(ctx, w * 0.42, h * 0.82, h / 175, Math.min(ph, 2.5), { color: INK, trail: true })
          const count = cycle < 0.25 ? '1' : cycle < 0.5 ? '2' : cycle < 0.75 ? '3' : 'ONE'
          const isDown = cycle >= 0.75
          label(ctx, count, w * 0.78, h * 0.4, isDown ? GOLD : ACCENT, Math.min(46, w * 0.13), 800)
          label(ctx, isDown ? 'STRIKE' : 'back', w * 0.78, h * 0.49, DIM, Math.min(12, w * 0.032))
          // ratio bar
          ctx.fillStyle = 'rgba(255,255,255,0.08)'
          roundRect(ctx, w * 0.15, h * 0.9, w * 0.7, 8, 4)
          ctx.fill()
          ctx.fillStyle = cycle < 0.75 ? ACCENT : GOLD
          roundRect(ctx, w * 0.15, h * 0.9, w * 0.7 * cycle, 8, 4)
          ctx.fill()
        },
      },
      compareScene('Rushed vs finished', 'Left: the downswing starts before the backswing ends — over the top, open face, lost speed. Right: the backswing finishes, then the ground starts the strike. The ball isn\'t going anywhere.',
        '1.8 : 1 rushed', '3 : 1 tour', {}, { trail: true }, 2.5),
      checklistScene('Tempo checkpoints', 'Anchor the ratio to a count or a metronome at seventy-two beats per minute. Ratios survive pressure far better than positions do.',
        ['"1-2-3 / ONE" fits your swing', 'Pause swings fly near-stock distance', 'Studio ratio 2.6 – 3.4', 'Same count, driver through wedge']),
      outroScene('Finish the backswing', 'When a swing feels quick, never slow down the strike — finish the backswing. Three counts back, and the down takes care of itself.'),
    ],
  },

  // ── DRIVER ────────────────────────────────────────────────────────────
  'driver-launch': {
    title: 'Driver: hit up on it',
    scenes: [
      titleScene('Hit up, launch high, spin low', 'Driving · distance',
        'The driver is the only club designed to be struck on the upswing. Get the attack angle right and there are twenty free yards waiting with the swing you already own.'),
      statScene('25', 'free yards', 'from hitting up 4° instead of down 2° — same swing speed',
        'Launch monitor data is unambiguous. At ninety miles an hour, hitting up four degrees instead of down two adds up to twenty-five yards of carry. Not from speed. From geometry.'),
      {
        caption: 'Setup presets the launch',
        narration: 'Ball off the lead heel, tee tall — half the ball above the crown. Drop the trail shoulder so the spine tilts away from the target. Now the club reaches the ball after the bottom of the arc, already traveling up the ramp.',
        minMs: 8500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          drawGolfer(ctx, w * 0.42, h * 0.82, h / 175, 0, { color: INK, showBall: false, spineTiltExtra: 6 })
          // tall tee ball forward
          const bx = w * 0.42 + (h / 175) * 17
          ctx.strokeStyle = DIM
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(bx, h * 0.82)
          ctx.lineTo(bx, h * 0.795)
          ctx.stroke()
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(bx, h * 0.787, 4.5, 0, Math.PI * 2)
          ctx.fill()
          // upward arc through ball
          const k = easeOut(clamp01(t * 1.3))
          ctx.strokeStyle = ACCENT
          ctx.setLineDash([6, 6])
          ctx.lineWidth = 2.5
          ctx.beginPath()
          for (let i = 0; i <= 30 * k; i++) {
            const u = i / 30
            const x = bx - w * 0.16 + u * w * 0.34
            const yy = h * 0.79 + Math.pow(u - 0.32, 2) * h * 0.32 - h * 0.005
            i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy)
          }
          ctx.stroke()
          ctx.setLineDash([])
          arrow(ctx, bx + w * 0.06, h * 0.78, bx + w * 0.14, h * 0.71, ACCENT)
          pill(ctx, 'strike on the UPswing', bx + w * 0.04, h * 0.62, ACCENT, Math.min(12, w * 0.03))
          pill(ctx, 'spine tilts away', w * 0.24, h * 0.4, GOLD, Math.min(11, w * 0.028))
        },
      },
      {
        caption: 'High launch / low spin vs the balloon',
        narration: 'The up-strike flies high with low spin and carries forever. The down-strike adds spin — the ball climbs, stalls, and falls out of the sky short. Same speed. Twenty-five yards apart.',
        minMs: 8000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          const tt = loop(t, 1.2)
          flight(ctx, w * 0.06, h * 0.82, tt, w * 1.45, { high: true, color: ACCENT })
          // balloon: climbs steep, stalls, drops
          ctx.strokeStyle = RED
          ctx.lineWidth = 2.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          const steps = Math.floor(48 * tt)
          for (let i = 0; i <= steps; i++) {
            const u = i / 48
            const x = w * 0.06 + w * 0.46 * Math.min(u * 1.25, 1)
            const y = h * 0.82 - Math.sin(Math.min(u * 1.45, 1) * Math.PI) * 0.36 * h - u * 14
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.stroke()
          pill(ctx, '✓ 14° launch · 2300 rpm', w * 0.7, h * 0.38, ACCENT, Math.min(11, w * 0.028))
          pill(ctx, '✗ balloons & stalls', w * 0.34, h * 0.2, RED, Math.min(11, w * 0.028))
        },
      },
      checklistScene('Tee-box checkpoints', 'And on tight holes, grip down half an inch and swing at eighty percent. Seven yards shorter, thirty percent straighter — that trade wins money for the rest of your life.',
        ['Half the ball above the crown', 'Ball off the lead heel', 'Spine tilted away, hands level', 'Aimed at an edge, 80% swing']),
      outroScene('Sweep it off the ramp', 'Tee it high, tilt away, and swing up the ramp. The launch monitor numbers take care of themselves.'),
    ],
  },

  // ── IRONS ─────────────────────────────────────────────────────────────
  'iron-compression': {
    title: 'Compress your irons',
    scenes: [
      titleScene('Ball first, turf second', 'Irons · contact',
        'The clearest line between single-digit golfers and everyone else is one invisible spot: where the swing bottoms out. Move it four inches and your iron game changes forever.'),
      {
        caption: 'The low point decides everything',
        narration: 'The arc bottoms out under your lead shoulder. Hang back, and it bottoms behind the ball — a little early is fat, a little late is thin. Shift forward, and the divot starts after the ball. Every time.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          ctx.strokeStyle = DIM
          ctx.setLineDash([5, 7])
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(w * 0.5, h * 0.06, h * 0.76, Math.PI * 0.34, Math.PI * 0.66)
          ctx.stroke()
          ctx.setLineDash([])
          const bx = w * 0.45
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(bx, h * 0.8, 6, 0, Math.PI * 2)
          ctx.fill()
          const lx = w * 0.57
          arrow(ctx, lx, h * 0.6, lx, h * 0.78, ACCENT)
          pill(ctx, 'low point AFTER the ball', lx, h * 0.54, ACCENT, Math.min(12, w * 0.03))
          const dv = easeOut(clamp01(t * 1.8))
          ctx.fillStyle = 'rgba(190,130,70,0.65)'
          roundRect(ctx, bx + 10, h * 0.815, 44 * dv, 6, 3)
          ctx.fill()
          label(ctx, 'divot', bx + 32, h * 0.89, 'rgba(190,130,70,0.9)', Math.min(12, w * 0.03))
          label(ctx, 'hit DOWN → ball goes UP', w * 0.5, h * 0.15, GOLD, Math.min(15, w * 0.04))
        },
      },
      compareScene('Scoop vs trap', 'Left: the scoop — weight back, wrists flipping, trying to lift it. Right: hands ahead, chest covering the ball, eighty percent of pressure on the lead side. The loft does the lifting. It always did.',
        'scooping', 'compressed', { hipSwayExtra: 8 }, { trail: true }, 2.9),
      statScene('1.5', 'clubs longer', 'a compressed strike flies vs the same swing caught slightly fat',
        'Strike quality is distance. A compressed seven iron flies a club and a half past the same swing caught a groove low. You don\'t need a new swing for more distance — you need the same swing to bottom out in the same place.'),
      checklistScene('Strike checkpoints', 'Read your divots like a launch monitor: starting at or after the ball, pointing at the target, dollar-bill shallow.',
        ['Divot starts AFTER the ball', 'Hands lead the clubhead', '80% pressure lead side at impact', 'Towel drill: 8 of 10 clean']),
      outroScene('Cover the ball with your chest', 'Pressure forward, hands ahead, chest over the ball. Hit down. The ball climbs the face and flies a club farther — compressed.'),
    ],
  },

  // ── UNEVEN LIES ───────────────────────────────────────────────────────
  'uneven-lies': {
    title: 'Uneven lies, solved',
    scenes: [
      titleScene('The four slopes, solved', 'Irons · on-course skills',
        'Almost no shot on a real course comes from a flat lie. Each slope pushes the ball a predictable direction — know the four biases and "random" misses become planned-for shots.'),
      {
        caption: 'Side-hill: the ball curves off the hill',
        narration: 'Ball above your feet, the lie flattens and the shot draws left — aim right. Ball below your feet, everything reverses and thin is the miss — flex more, hold the bend, aim left. The hill\'s spin is physics, not a maybe.',
        minMs: 9500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.95)
          const mode = loop(t, 1) < 0.5
          const tt = (loop(t, 1) * 2) % 1
          // sloped ground
          ctx.strokeStyle = 'rgba(52,211,153,0.5)'
          ctx.lineWidth = 2
          ctx.beginPath()
          if (mode) {
            ctx.moveTo(w * 0.1, h * 0.72)
            ctx.lineTo(w * 0.9, h * 0.85)
          } else {
            ctx.moveTo(w * 0.1, h * 0.85)
            ctx.lineTo(w * 0.9, h * 0.72)
          }
          ctx.stroke()
          drawGolfer(ctx, w * 0.4, mode ? h * 0.77 : h * 0.81, h / 200, 0, { color: INK })
          flight(ctx, w * 0.44, h * 0.74, tt, w * 1.1, { color: GOLD, curve: mode ? -0.14 : 0.14 })
          pill(ctx, mode ? 'ball ABOVE feet → flies LEFT' : 'ball BELOW feet → flies RIGHT', w * 0.5, h * 0.16, GOLD, Math.min(12, w * 0.032))
          label(ctx, mode ? 'aim right · expect draw' : 'aim left · flex & hold', w * 0.5, h * 0.26, DIM, Math.min(13, w * 0.034))
        },
      },
      {
        caption: 'Up & down the hill: club math',
        narration: 'Uphill adds loft — the ball flies high and short, so take one more club and swing up the ramp. Downhill delofts it — low, hot, and running, so take one less and land it short.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.95)
          const mode = loop(t, 1) < 0.5
          const tt = (loop(t, 1) * 2) % 1
          ctx.strokeStyle = 'rgba(52,211,153,0.5)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(w * 0.08, mode ? h * 0.88 : h * 0.7)
          ctx.lineTo(w * 0.92, mode ? h * 0.66 : h * 0.88)
          ctx.stroke()
          drawGolfer(ctx, w * 0.35, mode ? h * 0.81 : h * 0.76, h / 200, 0, { color: INK })
          flight(ctx, w * 0.4, mode ? h * 0.76 : h * 0.73, tt, w, { high: mode, color: GOLD })
          pill(ctx, mode ? 'UPHILL: +1 club, flies high' : 'DOWNHILL: −1 club, lands hot', w * 0.5, h * 0.15, GOLD, Math.min(12, w * 0.032))
        },
      },
      checklistScene('Slope checkpoints', 'And every slope shot is an eighty percent swing — balance is the first casualty on a hillside, and slopes punish ambition more than any bunker.',
        ['Shoulders match the hillside', 'Aim adjusted BEFORE club choice', '+1 club up · −1 club down', '80% swing, balanced finish']),
      outroScene('Swing with the hill', 'Match the slope, pre-aim the curve, take the smooth swing. The hill always wins — so join it.'),
    ],
  },

  // ── WEDGE CLOCK ───────────────────────────────────────────────────────
  'wedge-clock': {
    title: 'The clock system',
    scenes: [
      titleScene('Own every yardage inside 120', 'Short game · scoring zone',
        'Tour players don\'t feel a sixty-seven yard shot — they pull a calibrated swing. Three backswing lengths, three wedges, nine exact numbers. This is the system.'),
      statScene('45', 'feet vs 18', 'amateur vs tour proximity from 50–120 yards — mostly DISTANCE error',
        'From the scoring zone, tour players hit it inside eighteen feet. Amateurs average over forty-five — and the gap is distance control, not direction. Nine known carries close most of it.'),
      {
        caption: '9:00 · 10:30 · Full — same tempo',
        narration: 'Lead arm to nine o\'clock. To ten thirty. To a full eleven. Identical tempo, full body rotation through every one. Five balls each across three wedges, log the carries — the median is your number.',
        minMs: 10000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          const seg = Math.floor(loop(t, 1) * 2.99)
          const data = [
            { p: 0.9, lbl: '9:00', yds: '52', col: ACCENT },
            { p: 1.2, lbl: '10:30', yds: '68', col: GOLD },
            { p: 1.5, lbl: 'Full', yds: '85', col: RED },
          ][seg]
          // clock arc
          ctx.strokeStyle = DIM
          ctx.setLineDash([3, 6])
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(w * 0.45, h * 0.44, h * 0.33, Math.PI * 0.5, Math.PI * 1.5)
          ctx.stroke()
          ctx.setLineDash([])
          ;[['9:00', Math.PI], ['10:30', Math.PI * 0.75], ['12', Math.PI * 0.5]].forEach(([lab, ang]) => {
            const a = ang as number
            label(ctx, lab as string, w * 0.45 + Math.cos(a + Math.PI / 2) * h * 0.38, h * 0.44 - Math.sin(a + Math.PI / 2) * -h * 0.38 * -1 + 0, DIM, Math.min(11, w * 0.028))
          })
          drawGolfer(ctx, w * 0.45, h * 0.84, h / 185, data.p, { color: INK, trail: true })
          label(ctx, data.lbl, w * 0.82, h * 0.34, data.col, Math.min(22, w * 0.055), 800)
          label(ctx, `${data.yds} yds`, w * 0.82, h * 0.43, INK, Math.min(16, w * 0.04), 700)
          label(ctx, 'carry', w * 0.82, h * 0.49, DIM, Math.min(11, w * 0.026))
        },
      },
      compareScene('Decel vs commit', 'The number one wedge killer is deceleration — a long backswing easing off through the ball. Take distance off with a SHORTER backswing, never a slower strike. Short back, aggressive turn through.',
        'long & easing', 'short & committed', {}, { trail: true }, 2.9),
      checklistScene('Clock checkpoints', 'Write the nine numbers on a card for your bag. Seventy-eight to the pin stops being a guess — it\'s your ten-thirty sand wedge, by name.',
        ['Nine carries written down', 'Same tempo at all three lengths', 'Spread per position ±4 yards', 'Grip down 1 inch = −5 yards']),
      outroScene('Pull a number, not a feel', 'Feel drifts day to day. Calibration doesn\'t. Inside 120, you\'re not guessing anymore — you\'re doing arithmetic.'),
    ],
  },

  // ── GREENSIDE ─────────────────────────────────────────────────────────
  'greenside-system': {
    title: 'One chip, four trajectories',
    scenes: [
      titleScene('One chip motion, four trajectories', 'Short game · around the green',
        'Six chipping techniques all break under pressure. One motion with four setups doesn\'t. Change the dial, never the swing.'),
      statScene('85', '% vs 30%', 'tour vs amateur up-and-down rate from the fringe',
        'Tour players get up and down from greenside grass around eighty-five percent of the time. Fifteen handicaps, about thirty. The difference is not talent — it\'s that pros eliminated the variables.'),
      {
        caption: 'The trajectory dial: ball position + face',
        narration: 'Same motion every time. Ball back two inches: a bullet that lands early and releases. Ball forward with the face slightly open: the high floater that sits. The swing never changes — pressure can\'t break what doesn\'t move.',
        minMs: 9500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.86)
          const mode = loop(t, 1) < 0.5
          const tt = (loop(t, 1) * 2) % 1
          label(ctx, '⛳', w * 0.84, h * 0.82, INK, Math.min(20, w * 0.05))
          if (mode) {
            // runner: short fly, long roll
            const flyT = Math.min(1, tt * 2)
            flight(ctx, w * 0.14, h * 0.85, flyT, w * 0.5, { high: false, color: GOLD, rangeFrac: 0.36 })
            if (tt > 0.5) {
              const ru = easeOut((tt - 0.5) * 2)
              ctx.fillStyle = '#fff'
              ctx.beginPath()
              ctx.arc(w * 0.32 + ru * w * 0.5, h * 0.853, 4, 0, Math.PI * 2)
              ctx.fill()
            }
            pill(ctx, 'ball BACK: ⅓ fly · ⅔ roll', w * 0.5, h * 0.18, GOLD, Math.min(12, w * 0.032))
          } else {
            flight(ctx, w * 0.14, h * 0.85, tt, w, { high: true, color: ACCENT, rangeFrac: 0.66 })
            pill(ctx, 'ball UP + face open: floats & stops', w * 0.5, h * 0.18, ACCENT, Math.min(12, w * 0.032))
          }
          label(ctx, 'same swing — only the setup changed', w * 0.5, h * 0.95, DIM, Math.min(12, w * 0.032))
        },
      },
      {
        caption: 'Landing spot first, club second',
        narration: 'Walk on, find the flat spot two paces past the fringe — that\'s the target, never the flag. Pitching wedge rolls two-thirds. Eight iron rolls three-quarters. Land on your spot and let the ratio finish the job.',
        minMs: 8500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.86)
          const p = loop(t, 2)
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(w * 0.46, h * 0.84, 12 + p * 12, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 0.4
          ctx.beginPath()
          ctx.arc(w * 0.46, h * 0.84, 24 + p * 14, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 1
          pill(ctx, 'land HERE', w * 0.46, h * 0.66, ACCENT, Math.min(12, w * 0.03))
          label(ctx, '⛳', w * 0.8, h * 0.82, INK, Math.min(20, w * 0.05))
          flight(ctx, w * 0.12, h * 0.86, Math.min(1, loop(t, 2) * 1.5), w * 0.74, { high: true, color: GOLD, rangeFrac: 0.46 })
          label(ctx, 'PW: ⅓ fly · 8i: ¼ fly · SW: ½ fly', w * 0.5, h * 0.95, DIM, Math.min(12, w * 0.032))
        },
      },
      checklistScene('Chip checkpoints', 'Weight sixty percent lead and it never moves. Shoulders rock, chest turns, wrists stay quiet. It\'s a putt with loft.',
        ['Landing spot before club', 'Weight stays 60% lead', 'Lead wrist flat at the finish', 'Least loft that still works']),
      outroScene('Land it on the spot, let it roll', 'The flag is a lie. The landing spot is the truth. One motion, four setups — every greenside shot is now a rehearsed shot.'),
    ],
  },

  // ── BUNKER ────────────────────────────────────────────────────────────
  'bunker-play': {
    title: 'Bunkers: miss on purpose',
    scenes: [
      titleScene('The only shot where you miss on purpose', 'Short game · sand',
        'The greenside bunker shot is the one swing in golf where the club never touches the ball. Once that clicks, the most feared shot in amateur golf becomes one of the most repeatable.'),
      statScene('2', 'inches behind', 'your real target — the sand, not the ball',
        'Pros hit the green from greenside sand over ninety percent of the time, because this shot has the biggest margin in golf: anywhere from one to three inches behind the ball works. Trying to pick it clean has a margin of zero.'),
      {
        caption: 'Open the face, splash the dollar bill',
        narration: 'Open the face before you grip — that puts the sole\'s bounce in play so the club skims instead of digging. Picture the ball on a dollar bill. Your job: splash the whole bill onto the green. The ball just rides along.',
        minMs: 9500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.9)
          // bunker
          ctx.fillStyle = 'rgba(246,214,147,0.55)'
          ctx.beginPath()
          ctx.ellipse(w * 0.36, h * 0.87, w * 0.27, h * 0.075, 0, 0, Math.PI * 2)
          ctx.fill()
          // ball + bill
          ctx.fillStyle = 'rgba(140,200,120,0.8)'
          roundRect(ctx, w * 0.3, h * 0.845, w * 0.13, h * 0.018, 3)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(w * 0.365, h * 0.835, 5, 0, Math.PI * 2)
          ctx.fill()
          // entry arrow 2" behind
          const blink = loop(t, 3) > 0.4
          if (blink) arrow(ctx, w * 0.27, h * 0.7, w * 0.305, h * 0.835, GOLD)
          pill(ctx, 'enter 2″ behind', w * 0.24, h * 0.64, GOLD, Math.min(11, w * 0.028))
          // splash + ball out
          const tt = loop(t, 1.4)
          if (tt > 0.35) {
            const k = (tt - 0.35) / 0.65
            for (let i = 0; i < 9; i++) {
              const a = -0.4 - i * 0.09
              const r = easeOut(k) * w * 0.13 * (0.6 + (i % 3) * 0.25)
              ctx.fillStyle = `rgba(246,214,147,${0.7 - k * 0.5})`
              ctx.beginPath()
              ctx.arc(w * 0.36 + Math.cos(a) * r, h * 0.84 + Math.sin(a) * r, 2.5, 0, Math.PI * 2)
              ctx.fill()
            }
            flight(ctx, w * 0.37, h * 0.83, k, w * 0.62, { high: true, color: ACCENT, rangeFrac: 0.42 })
          }
          label(ctx, '⛳', w * 0.82, h * 0.78, INK, Math.min(20, w * 0.05))
        },
      },
      compareScene('Dig vs splash', 'A square face digs — the club stops dead and so does the ball. The open face skims on its bounce and throws sand AND ball onto the green. Open it before you grip, never by twisting your hands.',
        'square face digs', 'open face skims', {}, { trail: true }, 2.9),
      checklistScene('Bunker checkpoints', 'And swing with real speed — sand absorbs seventy percent of it. A ten-yard splash needs a forty-yard swing, finishing full with the chest at the target.',
        ['Face opened BEFORE the grip', 'Feet shuffled in, ball forward', 'Enter 2 inches behind', 'FULL finish — never quit on it']),
      outroScene('Throw a scoop of sand onto the green', 'Forget the ball completely. Splash the sand out — the ball has no choice but to come along. That\'s the whole trick.'),
    ],
  },

  // ── PUTTING SPEED ─────────────────────────────────────────────────────
  'putting-speed': {
    title: 'Speed is 90% of putting',
    scenes: [
      titleScene('Speed is 90% of putting', 'Putting · distance control',
        'Lab studies found amateurs\' lines on long putts are mostly fine — it\'s the distance that misses by ten feet. Three-putts are speed errors wearing a line-error costume.'),
      statScene('17', 'inches past', 'the optimal pace — fast enough to hold its line, slow enough to drop',
        'Dave Pelz\'s research found the optimal putt finishes about seventeen inches past the cup. At that speed the ball holds its line through the bumpy grass near the hole but still uses the whole cup.'),
      {
        caption: 'One tempo, every length',
        narration: 'The stroke is a pendulum — same one-two beat on six feet and sixty. Only the LENGTH changes. When tempo is fixed, your brain solves one variable instead of two.',
        minMs: 8500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.84)
          const a = Math.sin(loop(t, 2.6) * Math.PI * 2)
          const px = w * 0.28
          const py = h * 0.3
          ctx.strokeStyle = INK
          ctx.lineWidth = 3.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px + a * w * 0.13, py + h * 0.42)
          ctx.stroke()
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(px + a * w * 0.13, py + h * 0.72 - h * 0.3 + 0, 6.5, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, a < 0 ? 'one…' : 'two', px, h * 0.18, a < 0 ? DIM : ACCENT, Math.min(18, w * 0.046), 800)
          // rolling ball decaying to the hole
          const roll = easeOut(clamp01(Math.max(0, a)))
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(px + w * 0.1 + roll * w * 0.42, h * 0.845, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#0a0f0c'
          ctx.beginPath()
          ctx.ellipse(w * 0.84, h * 0.845, 8, 5.5, 0, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, 'length back = distance · tempo never changes', w * 0.5, h * 0.95, DIM, Math.min(12, w * 0.032))
        },
      },
      {
        caption: 'Dying speed uses the whole cup',
        narration: 'A ball dying at the hole can fall in from the front, the sides, even the back door. A ball charging three feet past only catches dead center — and the lip-out leaves four feet coming back. Aggressive putting is a leak dressed up as confidence.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.84)
          const hx = w * 0.76
          // good
          const t1 = easeOut(clamp01(loop(t, 1.3) * 1.25))
          ctx.fillStyle = '#0a0f0c'
          ctx.beginPath()
          ctx.ellipse(hx, h * 0.38, 9 + (1 - t1) * 0 + 6, 6, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 1.5
          ctx.stroke()
          ctx.fillStyle = ACCENT
          ctx.beginPath()
          ctx.arc(w * 0.1 + t1 * (hx - w * 0.08), h * 0.38, 5.5, 0, Math.PI * 2)
          ctx.fill()
          pill(ctx, '✓ dying: whole cup plays', w * 0.42, h * 0.25, ACCENT, Math.min(11, w * 0.029))
          // bad
          const t2 = clamp01(loop(t, 1.3) * 1.05)
          ctx.fillStyle = '#0a0f0c'
          ctx.beginPath()
          ctx.ellipse(hx, h * 0.66, 9, 6, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = RED
          ctx.stroke()
          ctx.fillStyle = RED
          ctx.beginPath()
          ctx.arc(w * 0.1 + t2 * w * 0.85, h * 0.66 + (t2 > 0.78 ? Math.sin((t2 - 0.78) * 30) * 4 : 0), 5.5, 0, Math.PI * 2)
          ctx.fill()
          pill(ctx, '✗ charging: lip-out + 4 ft back', w * 0.42, h * 0.82, RED, Math.min(11, w * 0.029))
        },
      },
      checklistScene('Speed checkpoints', 'Lag putts aim at a three-foot circle, not the cup. Eight of ten inside the circle and three-putts disappear from your card.',
        ['Same "one-two" on every putt', 'Misses finish 12–18″ past', '8/10 lags inside 3 feet', 'Speed calibrated before every round']),
      outroScene('Putt with your eyes', 'Practice strokes looking at the HOLE — your eyes compute distance better than your mind ever will. Then trust the pendulum.'),
    ],
  },

  // ── GREEN READING ─────────────────────────────────────────────────────
  'green-reading': {
    title: 'Green reading: feet first',
    scenes: [
      titleScene('Feel the slope, do the math', 'Putting · green reading',
        'AimPoint changed tour putting by proving your feet sense slope better than your eyes — which get fooled by grain, shadows and mow lines, all day long.'),
      {
        caption: 'Straddle the line. Which foot is heavier?',
        narration: 'Stand astride your line halfway to the hole and close your eyes for a beat. Barely feel a difference — one percent. Clearly one foot lower — two. You\'d notice it walking — three. That number drives the whole read.',
        minMs: 9500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.95)
          // tilted green surface
          const pct = 1 + Math.floor(loop(t, 1) * 2.99)
          const tilt = pct * 0.02
          ctx.fillStyle = 'rgba(22,101,52,0.5)'
          ctx.beginPath()
          ctx.moveTo(0, h * (0.62 - tilt * 4))
          ctx.lineTo(w, h * (0.62 + tilt * 4))
          ctx.lineTo(w, h * 0.95)
          ctx.lineTo(0, h * 0.95)
          ctx.fill()
          // feet
          const fy = (x: number) => h * (0.62 + ((x / w) - 0.5) * tilt * 8) - 6
          ctx.fillStyle = INK
          roundRect(ctx, w * 0.4 - 14, fy(w * 0.4), 28, 11, 5)
          ctx.fill()
          ctx.fillStyle = pct >= 2 ? GOLD : INK
          roundRect(ctx, w * 0.6 - 14, fy(w * 0.6), 28, 11, 5)
          ctx.fill()
          arrow(ctx, w * 0.6, fy(w * 0.6) + 30, w * 0.6, fy(w * 0.6) + 16, GOLD, 2.5)
          label(ctx, 'heavier foot = low side', w * 0.6, fy(w * 0.6) + 48, GOLD, Math.min(12, w * 0.03))
          label(ctx, `${pct}%`, w * 0.5, h * 0.3, ACCENT, Math.min(42, w * 0.115), 800)
          label(ctx, pct === 1 ? 'barely perceptible' : pct === 2 ? 'clearly one foot lower' : 'you\'d notice walking', w * 0.5, h * 0.4, DIM, Math.min(13, w * 0.035))
        },
      },
      {
        caption: 'Slope % × length × speed = break',
        narration: 'A ten footer on two percent at medium speed breaks about half a cup outside the edge. Double the length or the slope and the break roughly doubles. Then convert it to a SPOT — and putt dead straight at the spot.',
        minMs: 9500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.95)
          ctx.fillStyle = 'rgba(22,101,52,0.45)'
          ctx.fillRect(0, h * 0.18, w, h * 0.74)
          const hx = w * 0.62
          const hy = h * 0.26
          // hole + aim spot
          ctx.fillStyle = '#0a0f0c'
          ctx.beginPath()
          ctx.ellipse(hx, hy, 8, 5.5, 0, 0, Math.PI * 2)
          ctx.fill()
          const ax = hx - w * 0.13
          const blink = loop(t, 3) > 0.35
          if (blink) {
            ctx.strokeStyle = GOLD
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(ax, hy, 7, 0, Math.PI * 2)
            ctx.stroke()
          }
          pill(ctx, 'aim spot: 2 cups left', ax - w * 0.02, hy - h * 0.08, GOLD, Math.min(11, w * 0.028))
          // straight aim line
          ctx.setLineDash([4, 6])
          ctx.strokeStyle = 'rgba(255,255,255,0.35)'
          ctx.beginPath()
          ctx.moveTo(w * 0.45, h * 0.86)
          ctx.lineTo(ax, hy)
          ctx.stroke()
          ctx.setLineDash([])
          // breaking path
          const tt = easeOut(clamp01(loop(t, 1.5) * 1.2))
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 2.5
          ctx.beginPath()
          const N = Math.floor(40 * tt)
          for (let i = 0; i <= N; i++) {
            const u = i / 40
            const x = w * 0.45 + (ax - w * 0.45) * u + (hx - ax) * u * u
            const y = h * 0.86 + (hy - h * 0.86) * u
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.stroke()
          if (tt > 0 && tt < 1) {
            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(w * 0.45 + (ax - w * 0.45) * tt + (hx - ax) * tt * tt, h * 0.86 + (hy - h * 0.86) * tt, 4.5, 0, Math.PI * 2)
            ctx.fill()
          }
          label(ctx, 'putt STRAIGHT at the spot — gravity does the curve', w * 0.5, h * 0.96, DIM, Math.min(12, w * 0.031))
        },
      },
      checklistScene('Read checkpoints', 'Downhill putts break more — the ball moves slower, longer, giving gravity more time. And most break happens in the dying last third, so weight your read near the hole.',
        ['Slope felt with the feet first', 'Break → a concrete aim spot', 'Speed decided BEFORE line', 'Misses die on the HIGH side']),
      outroScene('Feel the percent, trust the spot', 'Your feet have the system pre-installed. Feel the number, pick the spot, release the blade. The Green Reader tool does the arithmetic until it lives in your head.'),
    ],
  },

  // ── COURSE IQ ─────────────────────────────────────────────────────────
  'course-iq': {
    title: 'Play the percentages',
    scenes: [
      titleScene('Course IQ: play the percentages', 'Strategy · scoring',
        'Strokes-gained research demolished golf\'s folk wisdom: you don\'t lose to better players on the greens. You lose with decisions. Here\'s the cheapest four strokes you\'ll ever save.'),
      statScene('4', 'strokes a round', 'available from tour-grade decisions — zero swing changes',
        'Mark Broadie\'s data shows the long game and decision quality explain about two-thirds of the gap between handicaps. A fifteen handicap making tour decisions saves four to six strokes without changing a single swing.'),
      {
        caption: 'You hit patterns, not points',
        narration: 'Your shots land in an ellipse. At the tucked pin, one in four of those shots is wet. The question is never "can I hit this shot" — it\'s "where does the whole pattern finish?"',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.97)
          // green + water
          ctx.fillStyle = 'rgba(16,185,129,0.3)'
          ctx.beginPath()
          ctx.ellipse(w * 0.55, h * 0.45, w * 0.2, h * 0.21, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(14,165,233,0.45)'
          ctx.beginPath()
          ctx.ellipse(w * 0.85, h * 0.5, w * 0.12, h * 0.3, 0, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, 'water', w * 0.85, h * 0.51, '#bae6fd', Math.min(12, w * 0.03))
          label(ctx, '⛳', w * 0.68, h * 0.47, INK, Math.min(17, w * 0.042))
          ctx.strokeStyle = RED
          ctx.setLineDash([6, 5])
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(w * 0.68, h * 0.46, w * 0.17, h * 0.19, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
          const n = Math.floor(easeOut(clamp01(t * 1.3)) * 24)
          for (let i = 0; i < n; i++) {
            const a = (i * 137.5 * Math.PI) / 180
            const r = Math.sqrt((i + 1) / 24)
            const x = w * 0.68 + Math.cos(a) * r * w * 0.155
            const y = h * 0.46 + Math.sin(a) * r * h * 0.17
            ctx.fillStyle = x > w * 0.745 ? RED : INK
            ctx.beginPath()
            ctx.arc(x, y, 3.2, 0, Math.PI * 2)
            ctx.fill()
          }
          pill(ctx, 'pin-hunt: 1 in 4 is WET', w * 0.45, h * 0.85, RED, Math.min(12, w * 0.032))
        },
      },
      {
        caption: 'Move the target, keep the swing',
        narration: 'Now shift the same ellipse to the center of the green. The water disappears from the pattern entirely, and the average putt is thirty feet. You didn\'t get better — you got smarter. Tour players aim at maybe three pins a round.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.97)
          ctx.fillStyle = 'rgba(16,185,129,0.3)'
          ctx.beginPath()
          ctx.ellipse(w * 0.55, h * 0.45, w * 0.2, h * 0.21, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(14,165,233,0.45)'
          ctx.beginPath()
          ctx.ellipse(w * 0.85, h * 0.5, w * 0.12, h * 0.3, 0, 0, Math.PI * 2)
          ctx.fill()
          label(ctx, '⛳', w * 0.68, h * 0.47, DIM, Math.min(17, w * 0.042))
          ctx.strokeStyle = ACCENT
          ctx.setLineDash([6, 5])
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(w * 0.52, h * 0.45, w * 0.17, h * 0.19, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
          const n = Math.floor(easeOut(clamp01(t * 1.3)) * 24)
          for (let i = 0; i < n; i++) {
            const a = (i * 137.5 * Math.PI) / 180
            const r = Math.sqrt((i + 1) / 24)
            ctx.fillStyle = ACCENT
            ctx.beginPath()
            ctx.arc(w * 0.52 + Math.cos(a) * r * w * 0.155, h * 0.45 + Math.sin(a) * r * h * 0.17, 3.2, 0, Math.PI * 2)
            ctx.fill()
          }
          pill(ctx, 'center green: 0% wet · 30 ft avg putt', w * 0.47, h * 0.85, ACCENT, Math.min(12, w * 0.032))
        },
      },
      checklistScene('Decision checkpoints', 'Bogey is never a disaster — double always is. Lay up to full-swing numbers, never short-side yourself, and let the GPS caddie price every target in expected strokes.',
        ['Aim the ELLIPSE, not the dream shot', 'Center of the green by default', 'Layups to a full-swing number', 'Miss on the fat side, always']),
      outroScene('The pin is a lie', 'Play one round making only center-green, fat-side decisions. Most players shoot a personal best — with the swing they already had.'),
    ],
  },

  // ── WIND ──────────────────────────────────────────────────────────────
  'wind-play': {
    title: 'Flight it, don\'t fight it',
    scenes: [
      titleScene('Wind: flight it, don\'t fight it', 'Strategy · conditions',
        'Wind doesn\'t just push the ball — it punishes spin. And the harder you swing, the more spin you feed it. The counter-intuitive truth of windy golf: swing easier.'),
      statScene('1', '% per mph', 'distance lost into the wind — and helping wind gives back only half',
        'Into the wind costs about one percent per mile per hour — a twenty mile-an-hour headwind turns one-fifty into one-eighty. Downwind gives back only half of that. The wind taxes you coming and going; the app\'s plays-like number does this math live.'),
      {
        caption: 'Balloon vs knockdown',
        narration: 'The full swing balloons — extra spin climbs into the wind, stalls, and drops forty yards short. The knockdown bores under it: ball back, grip down, two extra clubs, eighty percent, finish low. Three strokes a round on a windy day, one shot to learn.',
        minMs: 10000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          // wind arrows
          for (let i = 0; i < 4; i++) {
            const drift = (loop(t, 2.5) * 30) % 30
            arrow(ctx, w * 0.92 - drift - i * 26, h * (0.16 + i * 0.1), w * 0.8 - drift - i * 26, h * (0.16 + i * 0.1), 'rgba(96,165,250,0.45)', 2)
          }
          const tt = loop(t, 1.3)
          // balloon
          ctx.strokeStyle = RED
          ctx.lineWidth = 2.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          const steps = Math.floor(48 * tt)
          for (let i = 0; i <= steps; i++) {
            const u = i / 48
            const x = w * 0.06 + w * 0.4 * Math.min(u * 1.3, 1)
            const y = h * 0.82 - Math.sin(Math.min(u * 1.5, 1) * Math.PI) * 0.4 * h - u * 12
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.stroke()
          pill(ctx, '✗ full swing balloons', w * 0.3, h * 0.22, RED, Math.min(11, w * 0.028))
          // knockdown
          flight(ctx, w * 0.06, h * 0.82, tt, w * 1.5, { high: false, color: ACCENT })
          pill(ctx, '✓ knockdown bores', w * 0.6, h * 0.56, ACCENT, Math.min(11, w * 0.028))
          label(ctx, 'ball back · grip down · 2 clubs more · 80% · finish low', w * 0.5, h * 0.95, GOLD, Math.min(12, w * 0.031))
        },
      },
      checklistScene('Wind checkpoints', 'Crosswinds: hold against it when a score is on the line — dead straight, five yards shorter. Ride it on open holes for free distance. And downwind shots land HOT: plan the release.',
        ['Grass thrown at shoulder height', 'Plays-like number, not raw yardage', 'Knockdown on demand', 'Downwind landing zones short']),
      outroScene('Swing easy when it blows', 'In a two-club wind, par is a great score and the field is shooting six over. Boring golf wins windy days — every time.'),
    ],
  },

  // ── RECOVERY ──────────────────────────────────────────────────────────
  'recovery-shots': {
    title: 'Escape like a pro',
    scenes: [
      titleScene('Trouble shots: escape like a pro', 'Strategy · recovery',
        'Pros hit awful drives too. The difference is the next thirty seconds. Tour recovery is a math problem with one rule: get back to a number you love, in one shot, with ninety-five percent certainty.'),
      {
        caption: 'The gap shot vs the punch-out',
        narration: 'The miracle through the three-foot gap works one time in five. The other four cost two shots each — that trade loses seven strokes per five attempts. The punch-out sideways converts a five-point-one position into a four-point-three. Boring wins.',
        minMs: 9500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h, 0.95)
          // trees
          const tree = (x: number, y: number, s: number) => {
            ctx.fillStyle = 'rgba(20,83,45,0.85)'
            ctx.beginPath()
            ctx.arc(x, y, s, 0, Math.PI * 2)
            ctx.arc(x - s * 0.7, y + s * 0.5, s * 0.8, 0, Math.PI * 2)
            ctx.arc(x + s * 0.7, y + s * 0.5, s * 0.8, 0, Math.PI * 2)
            ctx.fill()
          }
          tree(w * 0.5, h * 0.3, w * 0.07)
          tree(w * 0.62, h * 0.42, w * 0.06)
          tree(w * 0.42, h * 0.48, w * 0.06)
          label(ctx, '⛳', w * 0.84, h * 0.2, INK, Math.min(18, w * 0.045))
          // ball
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(w * 0.3, h * 0.7, 5, 0, Math.PI * 2)
          ctx.fill()
          const mode = loop(t, 1) < 0.5
          const tt = (loop(t, 1) * 2) % 1
          if (mode) {
            // hero attempt clips tree
            const k = Math.min(tt * 1.4, 0.55)
            ctx.strokeStyle = RED
            ctx.lineWidth = 2.5
            ctx.setLineDash([2, 4])
            ctx.beginPath()
            ctx.moveTo(w * 0.3, h * 0.7)
            ctx.lineTo(w * 0.3 + (w * 0.5) * k / 0.55 * 0.42, h * 0.7 - (h * 0.32) * k / 0.55)
            ctx.stroke()
            ctx.setLineDash([])
            if (tt > 0.55) pill(ctx, '✗ 1 in 5 — costs 7 strokes per 5 tries', w * 0.5, h * 0.88, RED, Math.min(11, w * 0.029))
          } else {
            const k = easeOut(tt)
            ctx.strokeStyle = ACCENT
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(w * 0.3, h * 0.7)
            ctx.lineTo(w * 0.3 - w * 0.16 * k, h * 0.7 + h * 0.1 * k)
            ctx.stroke()
            pill(ctx, '✓ punch out → your favorite wedge number', w * 0.5, h * 0.88, ACCENT, Math.min(11, w * 0.029))
          }
        },
      },
      {
        caption: 'The punch: golf\'s utility knife',
        narration: 'Ball well back, six iron, hands ahead, half swing, drive it low with a short finish. It leaves like a scared cat — under everything, running forever. Ten of these every range session; it\'s the most used specialty shot in real golf.',
        minMs: 8500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          const ph = loop(t, 1.5)
          const phase = ph < 0.5 ? ph * 2 : 1 + (ph - 0.5) * 3
          drawGolfer(ctx, w * 0.32, h * 0.82, h / 185, Math.min(phase, 2.9), { color: INK, trail: true })
          if (phase > 2.5) flight(ctx, w * 0.37, h * 0.8, (phase - 2.5) * 2.2, w * 1.7, { high: false, color: GOLD })
          // branch overhead
          ctx.strokeStyle = 'rgba(20,83,45,0.9)'
          ctx.lineWidth = 8
          ctx.beginPath()
          ctx.moveTo(w * 0.5, h * 0.05)
          ctx.lineTo(w * 0.95, h * 0.32)
          ctx.stroke()
          pill(ctx, 'half swing · hands ahead · low finish', w * 0.5, h * 0.94, GOLD, Math.min(11, w * 0.029))
        },
      },
      checklistScene('Escape checkpoints', 'From real rough, the grass closes the face and steals the spin — one more club, firmer lead hand, plan for twenty percent more rollout. From deep rough: wedge, sideways, no debate.',
        ['95% certainty rule applied', 'Escape to a full-swing number', 'Extra club from any rough', 'Zero gap shots all round']),
      outroScene('The best shot you\'ll hit today is sideways', 'Count disasters avoided like birdies. One disciplined punch-out turns a brewing triple into a tap-in bogey — dozens of times a season.'),
    ],
  },

  // ── PRESSURE ──────────────────────────────────────────────────────────
  'pressure-protocol': {
    title: 'The pressure protocol',
    scenes: [
      titleScene('The pressure protocol', 'Mental game',
        'Pressure doesn\'t break swings — it breaks routines, and the swing follows. Build the loop now, so it runs on autopilot when your hands shake.'),
      {
        caption: 'The 12-second box',
        narration: 'Behind the ball: smallest possible target — a branch, not a fairway. One rehearsal feeling the shot. Step in, set the face, one look, go. Under twelve seconds. Slow players aren\'t careful — they\'re giving doubt a microphone.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          const steps = ['TARGET', 'REHEARSE', 'ONE LOOK', 'GO']
          const active = Math.floor(easeOut(clamp01(t * 1.2)) * 3.99)
          steps.forEach((s, i) => {
            const x = w * (0.14 + i * 0.24)
            const on = i <= active
            ctx.strokeStyle = on ? ACCENT : DIM
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.arc(x, h * 0.42, Math.min(30, w * 0.075), 0, Math.PI * 2)
            ctx.stroke()
            if (on) {
              ctx.fillStyle = 'rgba(52,211,153,0.12)'
              ctx.fill()
            }
            label(ctx, `${i + 1}`, x, h * 0.445, on ? ACCENT : DIM, Math.min(19, w * 0.048), 800)
            label(ctx, s, x, h * 0.59, on ? INK : DIM, Math.min(11, w * 0.027))
          })
          // 12s timer bar
          ctx.fillStyle = 'rgba(255,255,255,0.08)'
          roundRect(ctx, w * 0.15, h * 0.74, w * 0.7, 7, 4)
          ctx.fill()
          ctx.fillStyle = GOLD
          roundRect(ctx, w * 0.15, h * 0.74, w * 0.7 * clamp01(t * 1.2), 7, 4)
          ctx.fill()
          label(ctx, '< 12 seconds, every shot, forever', w * 0.5, h * 0.85, GOLD, Math.min(13, w * 0.034))
        },
      },
      {
        caption: 'Exhale on the takeaway',
        narration: 'Inhale stepping in. Long exhale as the club starts back. It is physiologically impossible to hold peak tension on an exhale — this is biology doing the psychology\'s job. And after a bad shot: ten steps of anger, then it\'s just data.',
        minMs: 9000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          const breathe = (Math.sin(loop(t, 1.6) * Math.PI * 2 - Math.PI / 2) + 1) / 2
          for (let ring = 0; ring < 3; ring++) {
            ctx.strokeStyle = `rgba(52,211,153,${0.45 - ring * 0.15})`
            ctx.lineWidth = 2.5 - ring * 0.6
            ctx.beginPath()
            ctx.arc(w * 0.5, h * 0.42, (Math.min(w, h) * 0.1) + breathe * Math.min(w, h) * 0.13 + ring * 14, 0, Math.PI * 2)
            ctx.stroke()
          }
          label(ctx, breathe > 0.55 ? 'breathe in…' : 'long exhale — club starts back', w * 0.5, h * 0.75, INK, Math.min(15, w * 0.04))
          label(ctx, breathe > 0.55 ? '' : 'tension cannot survive this', w * 0.5, h * 0.82, DIM, Math.min(12, w * 0.03))
        },
      },
      checklistScene('Pressure checkpoints', 'Under adrenaline you\'ll fly it long — one more club, eighty percent swing, decided on the walk, never over the ball.',
        ['Routine identical, range & course', 'Named small target every shot', 'Exhale on every takeaway', 'Anger expires at 10 steps']),
      outroScene('Rehearse the moment until it\'s boring', 'Nobody is born clutch. They\'ve just run the same twelve seconds so many times the body doesn\'t know it\'s supposed to panic.'),
    ],
  },

  // ── PRACTICE DESIGN ───────────────────────────────────────────────────
  'practice-design': {
    title: 'Practice that transfers',
    scenes: [
      titleScene('Train ugly, play pretty', 'Practice · motor learning',
        'Motor-learning research has a brutal verdict: rake-and-hit practice feels productive and transfers almost nothing. Random practice feels worse — and transfers everything.'),
      {
        caption: 'Blocked vs random',
        narration: 'Thirty seven-irons in a row grooves a rhythm the course will never ask for — golf never asks the same question twice. After warm-up: different club, different target, full routine, every single ball.',
        minMs: 9500,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          ctx.strokeStyle = 'rgba(255,255,255,0.08)'
          ctx.setLineDash([4, 8])
          ctx.beginPath()
          ctx.moveTo(w / 2, h * 0.12)
          ctx.lineTo(w / 2, h * 0.9)
          ctx.stroke()
          ctx.setLineDash([])
          // blocked: same flights stacking
          const tt = loop(t, 2)
          for (let i = 0; i < 3; i++) {
            flight(ctx, w * 0.06, h * 0.82, tt, w * 0.85, { color: RED, rangeFrac: 0.42, high: true })
          }
          pill(ctx, '✗ 30× same shot', w * 0.27, h * 0.14, RED, Math.min(11, w * 0.028))
          // random: varied flights
          const shapes = [
            { high: true, rangeFrac: 0.4, curve: 0.05 },
            { high: false, rangeFrac: 0.45, curve: -0.04 },
            { high: true, rangeFrac: 0.3, curve: 0 },
          ]
          shapes.forEach((s, i) => {
            const local = clamp01(tt * 3 - i)
            flight(ctx, w * 0.56, h * 0.82, local, w * 0.85, { color: ACCENT, ...s })
          })
          pill(ctx, '✓ new question every ball', w * 0.74, h * 0.14, ACCENT, Math.min(11, w * 0.028))
        },
      },
      statScene('13', 'full swings', 'in a typical round — vs 25+ shots inside 100 yards',
        'Chart a real round: maybe thirteen full swings from good lies, and twenty-five or more partial wedges, chips, bunker shots and putts. Now look at how the average bucket gets spent. Flip the ratio.'),
      checklistScene('The 20-60-20 session', 'Twenty percent warm-up. Sixty percent random with full routines. Twenty percent scored games with consequences — the mild stress of a score is what teaches skills to show up on Saturday.',
        ['Warm-up: blocked is fine', 'Middle: never the same shot twice', 'Half the time inside 100 yards', 'End with a scored game']),
      outroScene('Practice golf, not swings', 'Fewer balls, more decisions. If the range feels harder and messier than before — that\'s the feeling of learning that sticks.'),
    ],
  },

  // ── WARMUP ────────────────────────────────────────────────────────────
  'warmup-routine': {
    title: 'The 25-minute warm-up',
    scenes: [
      titleScene('The 25-minute pre-round warm-up', 'Practice · game day',
        'The first tee is the worst place to discover today\'s swing. A warm-up isn\'t practice — it\'s reconnaissance. Find today\'s tempo, today\'s shape, today\'s green speed. Then go play what you brought.'),
      {
        caption: 'The timeline',
        narration: 'Five minutes of body. Ten climbing the bag — two balls per club, collecting today\'s shape, never grading it. Seven on the putting green calibrating speed. Three for the dress rehearsal: the exact first-tee shot, full routine.',
        minMs: 10000,
        draw: (ctx, t, w, h) => {
          stage(ctx, w, h)
          const blocks = [
            { label: 'BODY', sub: '5 min', frac: 0.2, col: BLUE },
            { label: 'BAG', sub: '10 min', frac: 0.4, col: ACCENT },
            { label: 'GREEN', sub: '7 min', frac: 0.28, col: GOLD },
            { label: 'TEE SHOT', sub: '3 min', frac: 0.12, col: RED },
          ]
          const k = easeOut(clamp01(t * 1.2))
          let x = w * 0.08
          blocks.forEach((b) => {
            const bw = w * 0.84 * b.frac * k
            ctx.fillStyle = b.col + '33'
            ctx.strokeStyle = b.col
            ctx.lineWidth = 1.5
            roundRect(ctx, x, h * 0.36, Math.max(bw - 4, 2), h * 0.16, 8)
            ctx.fill()
            ctx.stroke()
            if (bw > w * 0.09) {
              label(ctx, b.label, x + bw / 2, h * 0.435, INK, Math.min(11, w * 0.026), 800)
              label(ctx, b.sub, x + bw / 2, h * 0.485, b.col, Math.min(10, w * 0.024))
            }
            x += w * 0.84 * b.frac
          })
          const phase = loop(t, 1)
          const msg = phase < 0.25 ? 'wake the body — no judging yet'
            : phase < 0.55 ? 'two balls per club · find today\'s shape'
            : phase < 0.85 ? '5 lag putts — calibrate the surface'
            : 'last ball = first tee shot, rehearsed'
          label(ctx, msg, w * 0.5, h * 0.66, DIM, Math.min(13, w * 0.034))
          drawGolfer(ctx, w * 0.5, h * 0.92, h / 320, loop(t, 1.6) * 3.5, { color: 'rgba(238,244,241,0.3)' })
        },
      },
      compareScene('Surgery vs scouting', 'Whatever swing shows up is today\'s swing. Adjust targets, not mechanics — if it\'s a fade day, you play fades. Fixes live on Tuesday\'s range, never on Saturday\'s tee.',
        'fixing at 8:55', 'scouting the day', {}, { trail: true }),
      checklistScene('Warm-up checkpoints', 'Three-putting the first two holes costs more than any warm-up drive earns. Speed first, always.',
        ['Body moving before full swings', 'Today\'s shape found & accepted', '5 lags for green speed', 'First-tee shot rehearsed last']),
      outroScene('Walk to the tee with a plan', 'First-tee nerves hate a rehearsed shot. Twenty-five minutes of reconnaissance buys you three strokes on the front nine.'),
    ],
  },
}

export function getStoryboard(lessonId: string, title: string, _keys: string[], summary: string): Storyboard {
  const board = BOARDS[lessonId]
  if (board) return board
  // every lesson ships with a board; this fallback covers future additions
  return {
    title,
    scenes: [
      titleScene(title, 'TrueCaddie lesson', summary),
      outroScene('Take it to the range', summary),
    ],
  }
}

export function hasCustomVideo(lessonId: string): boolean {
  return lessonId in BOARDS
}

export type { Storyboard, Scene }
