import type { SwingFault, SwingMetric, SwingReport } from '../types/geo'

/**
 * On-device swing analysis. Samples frames from the recorded video, runs
 * MediaPipe Pose (WASM, lazy-loaded from CDN only when the user taps
 * Analyze), then derives the coaching numbers that matter:
 *
 *   tempo ratio  · backswing/downswing time (tour ideal ≈ 3:1)
 *   sway         · hip-center lateral drift in the backswing
 *   head drift   · head movement address → top
 *   spine lift   · early-extension proxy through impact
 *   knee flex    · loss of posture at the top
 *
 * Every fault maps to a fix cue and to drills in the practice library.
 */

interface FrameLm {
  t: number
  // normalized [0..1] coords of the landmarks we use
  nose: [number, number]
  lHip: [number, number]
  rHip: [number, number]
  lShoulder: [number, number]
  rShoulder: [number, number]
  lWrist: [number, number]
  rWrist: [number, number]
  lKnee: [number, number]
  rKnee: [number, number]
  lAnkle: [number, number]
  rAnkle: [number, number]
  visible: boolean
}

const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14'
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

let landmarkerPromise: Promise<any> | null = null

async function getLandmarker(): Promise<any> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import(/* @vite-ignore */ `${CDN}/+esm`)
      const files = await vision.FilesetResolver.forVisionTasks(`${CDN}/wasm`)
      return vision.PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
    })().catch((e) => {
      landmarkerPromise = null
      throw e
    })
  }
  return landmarkerPromise
}

const FPS = 20

export async function analyzeSwing(
  video: HTMLVideoElement,
  onProgress: (pct: number) => void,
): Promise<SwingReport> {
  const landmarker = await getLandmarker()
  const duration = Math.min(video.duration, 16)
  if (!Number.isFinite(duration) || duration < 0.8) {
    throw new Error('Video too short to analyze — capture the full swing.')
  }

  const frames: FrameLm[] = []
  const step = 1 / FPS
  const wasPaused = video.paused
  video.pause()

  for (let t = 0; t < duration; t += step) {
    await seek(video, t)
    const res = landmarker.detectForVideo(video, Math.round(t * 1000))
    const lm = res?.landmarks?.[0]
    if (lm && lm.length >= 33) {
      const P = (i: number): [number, number] => [lm[i].x, lm[i].y]
      const vis = (i: number) => (lm[i].visibility ?? 1) > 0.5
      frames.push({
        t,
        nose: P(0),
        lShoulder: P(11), rShoulder: P(12),
        lWrist: P(15), rWrist: P(16),
        lHip: P(23), rHip: P(24),
        lKnee: P(25), rKnee: P(26),
        lAnkle: P(27), rAnkle: P(28),
        visible: vis(11) && vis(12) && vis(23) && vis(24),
      })
    }
    onProgress(Math.min(99, Math.round((t / duration) * 100)))
  }
  if (!wasPaused) video.play().catch(() => {})
  onProgress(100)

  const usable = frames.filter((f) => f.visible)
  if (usable.length < FPS * 0.8) {
    throw new Error('Could not see the golfer clearly. Film from face-on or down-the-line with the full body in frame.')
  }
  return buildReport(usable)
}

function seek(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      video.removeEventListener('seeked', done)
      resolve()
    }
    video.addEventListener('seeked', done)
    video.currentTime = t
  })
}

// ── Event detection + metrics ───────────────────────────────────────────

function buildReport(frames: FrameLm[]): SwingReport {
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const hipW = avg(frames.map((f) => Math.abs(f.lHip[0] - f.rHip[0]))) || 0.08
  const shoulderW = avg(frames.map((f) => Math.abs(f.lShoulder[0] - f.rShoulder[0]))) || 0.1
  // hands = midpoint of wrists; the swing signature is hand height over time
  const handY = frames.map((f) => mid(f.lWrist, f.rWrist)[1])
  const handX = frames.map((f) => mid(f.lWrist, f.rWrist)[0])

  // address: first stretch where hands are low and still
  let addressIdx = 0
  for (let i = 0; i < frames.length - 3; i++) {
    const still = Math.abs(handY[i + 2] - handY[i]) < 0.01 && Math.abs(handX[i + 2] - handX[i]) < 0.01
    if (still && handY[i] > median(handY)) {
      addressIdx = i
      break
    }
  }
  // top: highest hands after address (min y)
  let topIdx = addressIdx
  for (let i = addressIdx + 2; i < frames.length; i++) {
    if (handY[i] < handY[topIdx]) topIdx = i
  }
  // takeaway start: last frame before meaningful hand movement toward the top
  let startIdx = addressIdx
  for (let i = addressIdx; i < topIdx; i++) {
    if (Math.hypot(handX[i + 1] - handX[i], handY[i + 1] - handY[i]) > 0.012) {
      startIdx = i
      break
    }
  }
  // impact: after top, hands return to (near) address height with max speed
  let impactIdx = Math.min(topIdx + 2, frames.length - 1)
  let bestSpeed = 0
  for (let i = topIdx + 1; i < frames.length - 1; i++) {
    if (handY[i] >= handY[addressIdx] - 0.06) {
      const speed = Math.hypot(handX[i + 1] - handX[i - 1], handY[i + 1] - handY[i - 1])
      if (speed > bestSpeed) {
        bestSpeed = speed
        impactIdx = i
      }
      if (handY[i] >= handY[addressIdx]) break
    }
  }
  if (impactIdx <= topIdx) impactIdx = Math.min(topIdx + 3, frames.length - 1)
  const finishIdx = frames.length - 1

  const tA = frames[startIdx].t
  const tT = frames[topIdx].t
  const tI = frames[impactIdx].t
  const back = Math.max(0.15, tT - tA)
  const down = Math.max(0.08, tI - tT)
  const tempo = back / down

  // sway: hip center x drift address → top, in hip-widths
  const hipX = (f: FrameLm) => mid(f.lHip, f.rHip)[0]
  const swayRaw = hipX(frames[topIdx]) - hipX(frames[addressIdx])
  const sway = Math.abs(swayRaw) / hipW

  // head drift address → top, in shoulder-widths
  const headDrift =
    Math.hypot(
      frames[topIdx].nose[0] - frames[addressIdx].nose[0],
      frames[topIdx].nose[1] - frames[addressIdx].nose[1],
    ) / shoulderW

  // early extension proxy: hip height rises into impact
  const hipY = (f: FrameLm) => mid(f.lHip, f.rHip)[1]
  const spineLift = (hipY(frames[addressIdx]) - hipY(frames[impactIdx])) / hipW

  // knee flex loss at top
  const kneeBend = (f: FrameLm) => Math.abs(mid(f.lKnee, f.rKnee)[1] - mid(f.lHip, f.rHip)[1])
  const kneeLoss = (kneeBend(frames[topIdx]) - kneeBend(frames[addressIdx])) / hipW

  // shoulder turn proxy: shoulder width shrinks as the body rotates
  const turnPct = 1 - Math.abs(frames[topIdx].lShoulder[0] - frames[topIdx].rShoulder[0]) / shoulderW

  const metrics: SwingMetric[] = [
    metric('tempo', 'Tempo ratio', `${tempo.toFixed(1)} : 1`, scoreBand(tempo, 2.6, 3.4, 1.6, 4.6), '3.0 : 1',
      tempo < 2.4 ? 'Transition is rushed — the downswing starts before the backswing finishes.'
      : tempo > 4 ? 'Backswing is slow relative to the strike; feel a more athletic move off the ball.'
      : 'Tour-grade rhythm. Protect this under pressure.'),
    metric('backswing', 'Backswing time', `${back.toFixed(2)}s`, scoreBand(back, 0.7, 1.05, 0.45, 1.5), '0.75–1.0s',
      back < 0.6 ? 'Quick takeaway — give the club time to set.' : 'Within the window that lets the body coil.'),
    metric('sway', 'Hip sway (back)', `${(sway * 100).toFixed(0)}% hip width`, 100 - clamp01(sway / 0.5) * 100, '< 15%',
      sway > 0.3 ? 'Hips slide instead of turning — power leaks and contact gets streaky.' : 'Centered pivot. This is what consistency is built on.'),
    metric('head', 'Head movement', `${(headDrift * 100).toFixed(0)}% shoulder width`, 100 - clamp01(headDrift / 0.6) * 100, '< 25%',
      headDrift > 0.4 ? 'Head moves off the ball going back — strike point wanders with it.' : 'Quiet head through the backswing.'),
    metric('posture', 'Posture into impact', spineLift > 0.12 ? 'Early extension' : 'Maintained', 100 - clamp01(spineLift / 0.35) * 100, 'maintained',
      spineLift > 0.12 ? 'Hips push toward the ball in the downswing — the classic early-extension pattern (blocks & hooks).' : 'You stay in your posture through the strike.'),
    metric('turn', 'Shoulder turn', `${Math.round(turnPct * 100)}% closed`, clamp01(turnPct / 0.75) * 100, '> 60%',
      turnPct < 0.45 ? 'Short turn — arms lift without the body coiling behind the ball.' : 'Full coil at the top.'),
  ]

  const faults = detectFaults({ tempo, sway, headDrift, spineLift, kneeLoss, turnPct })
  const score = Math.round(avg(metrics.map((m) => m.score)))

  return {
    analyzedAt: Date.now(),
    fps: FPS,
    frames: frames.length,
    view: 'unknown',
    events: { address: tA, top: tT, impact: tI, finish: frames[finishIdx].t },
    tempoRatio: Math.round(tempo * 10) / 10,
    metrics,
    faults,
    summary: buildSummary(score, tempo, faults),
    score,
  }
}

function detectFaults(m: { tempo: number; sway: number; headDrift: number; spineLift: number; kneeLoss: number; turnPct: number }): SwingFault[] {
  const out: SwingFault[] = []
  if (m.tempo < 2.3) {
    out.push({
      id: 'quick-transition', name: 'Rushed transition',
      severity: m.tempo < 1.9 ? 'major' : 'moderate',
      evidence: `Tempo ${m.tempo.toFixed(1)}:1 vs the 3:1 tour benchmark.`,
      fix: 'Feel like you finish the backswing, then say "one" before swinging down. Speed belongs at the ball, not at the top.',
      drillIds: ['tempo-track', 'pause-drill'],
    })
  }
  if (m.sway > 0.3) {
    out.push({
      id: 'sway', name: 'Hip sway',
      severity: m.sway > 0.5 ? 'major' : 'moderate',
      evidence: `Hips drift ${Math.round(m.sway * 100)}% of hip width going back.`,
      fix: 'Load INTO the trail hip, not past it. Feel the trail glute hold pressure as the chest turns.',
      drillIds: ['wall-hip-drill', 'step-through'],
    })
  }
  if (m.headDrift > 0.45) {
    out.push({
      id: 'head-drift', name: 'Head off the ball',
      severity: 'moderate',
      evidence: `Head moves ${Math.round(m.headDrift * 100)}% of shoulder width address → top.`,
      fix: 'Pick a blade of grass on the back of the ball and keep it in soft focus to the top.',
      drillIds: ['head-station', 'tempo-track'],
    })
  }
  if (m.spineLift > 0.12) {
    out.push({
      id: 'early-extension', name: 'Early extension',
      severity: m.spineLift > 0.25 ? 'major' : 'moderate',
      evidence: 'Hip center rises toward the ball before impact.',
      fix: 'Keep your belt buckle pointing down at the ball longer — feel your lead hip move back, not in.',
      drillIds: ['wall-hip-drill', 'chair-drill'],
    })
  }
  if (m.turnPct < 0.45) {
    out.push({
      id: 'short-turn', name: 'Incomplete shoulder turn',
      severity: 'minor',
      evidence: `Shoulders only ${Math.round(m.turnPct * 100)}% closed at the top.`,
      fix: 'Turn your lead shoulder behind the ball. Width and coil create speed you don\'t have to force.',
      drillIds: ['cross-arm-turns', 'pause-drill'],
    })
  }
  return out
}

function buildSummary(score: number, tempo: number, faults: SwingFault[]): string {
  const open =
    score >= 80 ? 'This is a strong move.' :
    score >= 60 ? 'Solid foundation with one clear unlock.' :
    'Good news: the issues here are connected — fix the first and the rest follow.'
  const main = faults[0]
    ? ` Priority: ${faults[0].name.toLowerCase()} — ${faults[0].fix}`
    : ` Tempo ${tempo.toFixed(1)}:1 with a centered pivot — keep grooving exactly this.`
  return open + main
}

// ── helpers ─────────────────────────────────────────────────────────────

const avg = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0)
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const median = (n: number[]) => [...n].sort((a, b) => a - b)[Math.floor(n.length / 2)] ?? 0

function metric(key: string, label: string, value: string, score: number, ideal: string, comment: string): SwingMetric {
  return { key, label, value, score: Math.round(Math.min(100, Math.max(0, score))), ideal, comment }
}

/** 100 inside [okLo, okHi], falling toward 0 at [badLo, badHi]. */
function scoreBand(v: number, okLo: number, okHi: number, badLo: number, badHi: number): number {
  if (v >= okLo && v <= okHi) return 100
  if (v < okLo) return 100 * clamp01((v - badLo) / (okLo - badLo))
  return 100 * clamp01((badHi - v) / (badHi - okHi))
}
