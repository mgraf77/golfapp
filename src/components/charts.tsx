import type { RangeShot } from '../types'
import { getClub } from '../data/clubs'

/** Lightweight SVG charts — no external library. */

// ── Line / trend chart ─────────────────────────────────────────────────

export function TrendChart({
  points, height = 120, formatValue = (v: number) => String(v), invert = false,
}: { points: { label: string; value: number }[]; height?: number; formatValue?: (v: number) => string; invert?: boolean }) {
  if (points.length === 0) return null
  const w = 320
  const pad = 14
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 1)
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(points.length - 1, 1)
  const y = (v: number) => {
    const t = (v - min) / span
    return invert ? pad + t * (height - pad * 2) : height - pad - t * (height - pad * 2)
  }
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ')
  const area = `${path} L${x(points.length - 1)},${height - 4} L${x(0)},${height - 4} Z`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
      <defs>
        <linearGradient id="trendfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendfill)" />
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="3.5" fill="var(--color-accent-bright)" />
          <text x={x(i)} y={y(p.value) - 9} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-ink)">
            {formatValue(p.value)}
          </text>
          <text x={x(i)} y={height - 1} textAnchor="middle" fontSize="9" fill="var(--color-faint)">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── Horizontal bar chart ────────────────────────────────────────────────

export function HBarChart({
  rows, unit = '', tone = 'bad',
}: { rows: { label: string; value: number }[]; unit?: string; tone?: 'good' | 'bad' | 'mixed' }) {
  const max = Math.max(...rows.map((r) => r.value), 0.1)
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-muted">{r.label}</span>
            <span className="font-semibold tabular-nums">
              {r.value}
              {unit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${tone === 'good' ? 'bg-accent' : tone === 'bad' ? (i === 0 ? 'bg-danger' : 'bg-gold') : 'bg-accent'}`}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Range dispersion plot ───────────────────────────────────────────────

const DEPTH_Y: Record<RangeShot['depth'], number> = { long: 0.22, on: 0.5, short: 0.78 }
const LINE_X: Record<RangeShot['line'], number> = { left: 0.25, center: 0.5, right: 0.75 }

export function DispersionPlot({ shots, height = 190 }: { shots: RangeShot[]; height?: number }) {
  const w = 320
  // deterministic jitter from shot index so the plot is stable
  const jitter = (n: number, axis: number) => (((n * 53 + axis * 97) % 23) - 11) / 11
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
      {/* target zones */}
      <rect x={0} y={0} width={w} height={height} rx={12} fill="var(--color-surface-2)" />
      <ellipse cx={w / 2} cy={height / 2} rx={70} ry={42} fill="var(--color-accent)" opacity="0.10" />
      <ellipse cx={w / 2} cy={height / 2} rx={40} ry={24} fill="var(--color-accent)" opacity="0.14" />
      <circle cx={w / 2} cy={height / 2} r={4} fill="var(--color-accent-bright)" />
      <line x1={w / 2} y1={10} x2={w / 2} y2={height - 10} stroke="var(--color-line)" strokeDasharray="3 5" />
      <line x1={14} y1={height / 2} x2={w - 14} y2={height / 2} stroke="var(--color-line)" strokeDasharray="3 5" />
      <text x={10} y={16} fontSize="9" fill="var(--color-faint)">LONG</text>
      <text x={10} y={height - 8} fontSize="9" fill="var(--color-faint)">SHORT</text>
      <text x={w - 38} y={height / 2 - 6} fontSize="9" fill="var(--color-faint)">RIGHT</text>
      <text x={14} y={height / 2 - 6} fontSize="9" fill="var(--color-faint)">LEFT</text>
      {shots.map((shot, i) => {
        const good = shot.depth === 'on' && shot.line === 'center'
        const cx = LINE_X[shot.line] * w + jitter(shot.n, 1) * 26
        const cy = DEPTH_Y[shot.depth] * height + jitter(shot.n, 2) * 16
        return (
          <circle
            key={shot.id}
            cx={cx} cy={cy} r={i === shots.length - 1 ? 6 : 4.5}
            fill={good ? 'var(--color-accent-bright)' : 'var(--color-danger)'}
            opacity={i === shots.length - 1 ? 1 : 0.55}
            stroke={i === shots.length - 1 ? 'var(--color-ink)' : 'none'}
            strokeWidth={1.5}
          />
        )
      })}
    </svg>
  )
}

// ── Club gapping chart (raw vs normalized) ─────────────────────────────

export function GappingChart({
  rows,
}: { rows: { clubId: string; raw: number; normalized: number }[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.raw, r.normalized)), 1)
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.clubId} className="flex items-center gap-2.5">
          <span className="w-7 shrink-0 text-[12px] font-semibold text-muted">{getClub(r.clubId as never).short}</span>
          <div className="relative h-5 flex-1">
            <div className="absolute top-0.5 h-1.5 rounded-full bg-faint/40" style={{ width: `${(r.raw / max) * 100}%` }} />
            <div className="absolute bottom-0.5 h-2 rounded-full bg-accent" style={{ width: `${(r.normalized / max) * 100}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right text-[12px] tabular-nums">
            <span className="text-faint">{r.raw}</span>
            <span className="text-accent-bright font-semibold"> {r.normalized}</span>
          </span>
        </div>
      ))}
      <div className="flex gap-4 pt-1 text-[10px] text-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-4 rounded-full bg-faint/40" /> Raw avg
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-accent" /> Normalized (true)
        </span>
      </div>
    </div>
  )
}
