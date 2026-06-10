import { useState } from 'react'
import type { BagClub, CaddieAdvice, Conditions, Hole } from '../types'
import { getClub } from '../data/clubs'
import { riskLabel } from '../lib/caddieEngine'
import { Badge } from './ui'

type ARMode = 'safe' | 'aggressive' | 'practice' | 'avoid'

const MODES: { id: ARMode; label: string }[] = [
  { id: 'safe', label: 'Safe' },
  { id: 'aggressive', label: 'Aggressive' },
  { id: 'practice', label: 'Practice' },
  { id: 'avoid', label: 'Miss Avoid' },
]

/**
 * XR overlay concept: a simulated view standing behind the ball with the
 * hole rendered in perspective and caddie intelligence layered on top.
 * This is the preview of the future AR/heads-up experience.
 */
export function ARPreview({
  hole, conditions, advice, bag, onClose,
}: { hole: Hole; conditions: Conditions; advice: CaddieAdvice; bag: BagClub[]; onClose: () => void }) {
  const [mode, setMode] = useState<ARMode>('safe')

  const W = 390
  const H = 620
  const horizonY = 150
  const teeY = 560
  // perspective mapping: yards from ball → screen y
  const yAt = (yds: number) => teeY - (teeY - horizonY - 28) * Math.pow(Math.min(yds / hole.yards, 1), 0.72)
  // width of fairway at a given y (perspective convergence)
  const halfWAt = (y: number) => 24 + ((y - horizonY) / (teeY - horizonY)) * 150

  const greenY = yAt(hole.yards)
  const waterRight = hole.hazards.some((h) => h.type === 'water' && h.side === 'right')
  const waterLeft = hole.hazards.some((h) => h.type === 'water' && h.side === 'left')
  const obRight = hole.hazards.some((h) => h.type === 'ob' && h.side === 'right')
  const obLeft = hole.hazards.some((h) => h.type === 'ob' && h.side === 'left')
  const dangerSide: 'left' | 'right' = waterRight || obRight ? 'right' : waterLeft || obLeft ? 'left' : 'right'
  const bunkers = hole.hazards.filter((h) => h.type === 'bunker' && h.fromTee)
  const creek = hole.hazards.find((h) => (h.type === 'creek' || h.type === 'water') && h.side === 'cross' && h.fromTee)

  const recClub = bag.find((b) => b.clubId === advice.club) ?? bag[0]
  const driver = bag.find((b) => b.clubId === 'DR') ?? recClub
  const safeDist = Math.min(recClub.total, hole.yards - 30)
  const aggDist = Math.min(driver.total, hole.yards - 15)

  const target = (() => {
    const sideShift = (d: 'left' | 'right', amt: number) => (d === 'left' ? -amt : amt)
    switch (mode) {
      case 'safe':
        return { d: safeDist, x: W / 2 + sideShift(dangerSide === 'right' ? 'left' : 'right', 26), label: `${getClub(advice.club).label} · ${safeDist} yds`, sub: advice.target, risk: advice.riskLevel }
      case 'aggressive':
        return { d: aggDist, x: W / 2 + sideShift(dangerSide === 'right' ? 'left' : 'right', 10), label: `Driver · ${aggDist} yds`, sub: `+${advice.aggressive.gain.toFixed(1)} SG · ${advice.aggressive.penaltyRisk.toFixed(1)} penalty risk`, risk: Math.min(advice.riskLevel + 35, 95) }
      case 'practice':
        return { d: safeDist, x: W / 2, label: `Practice window · ${safeDist} yds`, sub: 'Hit this 35-yd window 3 of 5 times', risk: 10 }
      case 'avoid':
        return { d: safeDist, x: W / 2 + sideShift(dangerSide === 'right' ? 'left' : 'right', 44), label: `Bias ${dangerSide === 'right' ? 'left' : 'right'} · ${safeDist} yds`, sub: `Your miss pattern says: take the ${dangerSide} side OUT of play`, risk: 15 }
    }
  })()

  const targetY = yAt(target.d)
  const windRotation = { calm: 0, into: 180, down: 0, 'cross-left': 270, 'cross-right': 90 }[conditions.windDir]

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),14px)] pb-2.5 border-b border-line/40 bg-bg/80 backdrop-blur z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold">XR Caddie View</span>
            <Badge tone="info">Concept Preview</Badge>
          </div>
          <div className="text-[11px] text-muted">Hole {hole.number} · Par {hole.par} · {hole.yards} yds</div>
        </div>
        <button onClick={onClose} className="rounded-xl bg-surface-2 border border-line px-3.5 py-2 text-sm font-medium active:scale-95">
          Done
        </button>
      </div>

      {/* Scene */}
      <div className="relative flex-1 overflow-hidden ar-sky">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="fairway" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#15402c" />
              <stop offset="100%" stopColor="#1d5a3c" />
            </linearGradient>
            <linearGradient id="roughL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e2c1e" />
              <stop offset="100%" stopColor="#123726" />
            </linearGradient>
            <radialGradient id="greenGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#2a7d52" />
              <stop offset="100%" stopColor="#1d5a3c" />
            </radialGradient>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#16435f" />
              <stop offset="100%" stopColor="#0d2c42" />
            </linearGradient>
          </defs>

          {/* rough (full ground below horizon) */}
          <rect x="0" y={horizonY} width={W} height={H - horizonY} fill="url(#roughL)" />

          {/* tree line on horizon */}
          {Array.from({ length: 14 }).map((_, i) => (
            <ellipse key={i} cx={i * 30 + 8} cy={horizonY + 2} rx={20} ry={9 + ((i * 13) % 7)} fill="#0a2418" />
          ))}

          {/* water hazard */}
          {(waterRight || waterLeft) && (
            <path
              d={
                waterRight
                  ? `M ${W} ${yAt(180)} Q ${W - 95} ${yAt(230)} ${W - 70} ${yAt(300)} L ${W} ${yAt(330)} Z`
                  : `M 0 ${yAt(180)} Q 95 ${yAt(230)} 70 ${yAt(300)} L 0 ${yAt(330)} Z`
              }
              fill="url(#waterGrad)"
              stroke="#2c6e96"
              strokeWidth="1.5"
            />
          )}
          {creek && (
            <path
              d={`M 0 ${yAt(creek.fromTee!) + 6} Q ${W / 2} ${yAt(creek.fromTee!) - 8} ${W} ${yAt(creek.fromTee!) + 4} L ${W} ${yAt(creek.fromTee!) + 14} Q ${W / 2} ${yAt(creek.fromTee!) + 2} 0 ${yAt(creek.fromTee!) + 16} Z`}
              fill="url(#waterGrad)"
            />
          )}

          {/* fairway */}
          <path
            d={`M ${W / 2 - halfWAt(teeY) * 0.55} ${teeY + 40}
                C ${W / 2 - halfWAt(yAt(120)) * 0.9} ${yAt(120)}, ${W / 2 - halfWAt(yAt(hole.yards * 0.6))} ${yAt(hole.yards * 0.6)}, ${W / 2 - 26} ${greenY + 14}
                L ${W / 2 + 26} ${greenY + 14}
                C ${W / 2 + halfWAt(yAt(hole.yards * 0.6))} ${yAt(hole.yards * 0.6)}, ${W / 2 + halfWAt(yAt(120)) * 0.9} ${yAt(120)}, ${W / 2 + halfWAt(teeY) * 0.55} ${teeY + 40} Z`}
            fill="url(#fairway)"
          />

          {/* bunkers */}
          {bunkers.map((b, i) => {
            const y = yAt(b.fromTee!)
            const off = (b.side === 'left' ? -1 : 1) * (halfWAt(y) * 0.75)
            return <ellipse key={i} cx={W / 2 + off} cy={y} rx={16 + (teeY - y) / 28} ry={6 + (teeY - y) / 80} fill="#c4ad7d" opacity="0.9" />
          })}

          {/* green + pin */}
          <ellipse cx={W / 2} cy={greenY} rx={34} ry={13} fill="url(#greenGrad)" stroke="#34d399" strokeWidth="1" strokeOpacity="0.5" />
          <line x1={W / 2 + 4} y1={greenY} x2={W / 2 + 4} y2={greenY - 26} stroke="#e9efec" strokeWidth="1.5" />
          <path d={`M ${W / 2 + 4} ${greenY - 26} l 11 4 l -11 4 Z`} fill="#f87171" />

          {/* OB stakes */}
          {(obRight || obLeft) &&
            Array.from({ length: 5 }).map((_, i) => {
              const y = yAt(80 + i * (hole.yards / 6))
              const x = obRight ? W / 2 + halfWAt(y) + 26 : W / 2 - halfWAt(y) - 26
              return <rect key={i} x={x} y={y - 7} width={2.5} height={9} fill="#f8fafc" opacity="0.85" />
            })}

          {/* miss-avoid shading over danger side */}
          {mode === 'avoid' && (
            <path
              d={
                dangerSide === 'right'
                  ? `M ${W / 2 + 18} ${greenY} L ${W} ${horizonY + 40} L ${W} ${teeY} L ${W / 2 + halfWAt(teeY) * 0.4} ${teeY} Z`
                  : `M ${W / 2 - 18} ${greenY} L 0 ${horizonY + 40} L 0 ${teeY} L ${W / 2 - halfWAt(teeY) * 0.4} ${teeY} Z`
              }
              fill="#f87171"
              opacity="0.13"
            />
          )}

          {/* distance arcs */}
          {[150, 200, 250]
            .filter((d) => d < hole.yards - 20)
            .map((d) => {
              const y = yAt(d)
              return (
                <g key={d}>
                  <path
                    d={`M ${W / 2 - halfWAt(y) - 18} ${y + 5} Q ${W / 2} ${y - 7} ${W / 2 + halfWAt(y) + 18} ${y + 5}`}
                    fill="none" stroke="#e9efec" strokeWidth="1" strokeDasharray="5 5" opacity="0.35"
                  />
                  <text x={W / 2 + halfWAt(y) + 24} y={y + 8} fontSize="11" fill="#cdd9d3" fontWeight="600">{d}</text>
                </g>
              )
            })}

          {/* intended ball flight */}
          <path
            d={`M ${W / 2} ${teeY + 26} Q ${target.x + (mode === 'aggressive' ? 24 : -16)} ${(teeY + targetY) / 2 - 60} ${target.x} ${targetY}`}
            fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" opacity="0.9"
          />

          {/* landing zone + target reticle */}
          <ellipse cx={target.x} cy={targetY} rx={mode === 'aggressive' ? 46 : 34} ry={mode === 'aggressive' ? 15 : 11} fill="#34d399" opacity="0.16" />
          <ellipse cx={target.x} cy={targetY} rx={mode === 'aggressive' ? 46 : 34} ry={mode === 'aggressive' ? 15 : 11} fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="6 4" />
          <circle cx={target.x} cy={targetY} r={5} fill="none" stroke="#34d399" strokeWidth="2" />
          <circle cx={target.x} cy={targetY} r={1.8} fill="#34d399" />

          {/* layup marker on par 5s */}
          {hole.par === 5 && (
            <g>
              <circle cx={W / 2} cy={yAt(hole.yards - 100)} r={4} fill="none" stroke="#f5b80b" strokeWidth="1.5" strokeDasharray="2 2" />
              <text x={W / 2 + 10} y={yAt(hole.yards - 100) + 4} fontSize="10" fill="#f5b80b" fontWeight="600">layup → 100</text>
            </g>
          )}

          {/* ball */}
          <circle cx={W / 2} cy={teeY + 26} r={5} fill="#f8fafc" />
          <ellipse cx={W / 2} cy={teeY + 33} rx={9} ry={2.5} fill="#000" opacity="0.4" />
        </svg>

        {/* Wind + elevation HUD */}
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-black/45 backdrop-blur px-3 py-2 border border-white/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-info" style={{ transform: `rotate(${windRotation}deg)` }} fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V7M12 5l-5 6M12 5l5 6" />
            </svg>
            <div>
              <div className="text-[13px] font-bold leading-none">{conditions.windSpeed} mph</div>
              <div className="text-[10px] text-muted capitalize">{conditions.windDir.replace('-', ' ')}</div>
            </div>
          </div>
          {hole.elevationFt !== 0 && (
            <div className="rounded-xl bg-black/45 backdrop-blur px-3 py-1.5 border border-white/10 text-[11px]">
              <span className={hole.elevationFt > 0 ? 'text-gold' : 'text-accent-bright'}>
                {hole.elevationFt > 0 ? '▲' : '▼'} {Math.abs(hole.elevationFt)} ft {hole.elevationFt > 0 ? 'uphill' : 'downhill'}
              </span>
            </div>
          )}
        </div>

        {/* Plays-like HUD */}
        <div className="absolute left-4 top-4 rounded-xl bg-black/45 backdrop-blur px-3 py-2 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-muted">Plays like</div>
          <div className="text-lg font-bold leading-tight tabular-nums">{advice.playsLike} <span className="text-[11px] font-medium text-muted">yds</span></div>
        </div>

        {/* Target card */}
        <div className="absolute inset-x-4 bottom-4">
          <div className="rounded-2xl border border-accent/30 bg-black/60 backdrop-blur-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[15px] font-bold">{target.label}</div>
                <div className="text-[12px] text-muted mt-0.5">{target.sub}</div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className={`text-[13px] font-bold ${target.risk < 35 ? 'text-accent-bright' : target.risk < 65 ? 'text-gold' : 'text-danger'}`}>
                  {riskLabel(target.risk)}
                </div>
                <div className="mt-1 h-1.5 w-20 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${target.risk < 35 ? 'bg-accent' : target.risk < 65 ? 'bg-gold' : 'bg-danger'}`}
                    style={{ width: `${target.risk}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="border-t border-line/50 bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),14px)]">
        <div className="flex rounded-xl bg-surface-2 border border-line p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 rounded-lg px-1 py-2 text-[12px] transition-all ${mode === m.id ? 'bg-accent text-[#04130d] font-bold' : 'text-muted'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-faint">
          Future XR mode: this overlay renders on live camera / smart glasses.
        </p>
      </div>
    </div>
  )
}
