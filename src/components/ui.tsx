import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

// ── Card ────────────────────────────────────────────────────────────────

export function Card({
  children, className = '', onClick, glow = false,
}: { children: ReactNode; className?: string; onClick?: () => void; glow?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)] ${glow ? 'border-accent/25 shadow-[var(--shadow-glow)]' : 'border-line'} ${onClick ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-2.5 px-0.5">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.13em] text-muted">{children}</h2>
      {action}
    </div>
  )
}

// ── Buttons & chips ────────────────────────────────────────────────────

export function Button({
  children, onClick, variant = 'primary', className = '', disabled = false, size = 'md',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'px-3.5 py-2 text-[13px] min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-5 py-3.5 text-[15px] min-h-[52px]',
  }
  const variants = {
    primary:
      'bg-gradient-to-b from-accent-bright to-accent-deep text-[#04130d] font-bold shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_6px_18px_-6px_rgba(16,185,129,0.55)]',
    secondary: 'bg-surface-2 border border-line-bright text-ink font-semibold shadow-[var(--shadow-card)]',
    ghost: 'text-accent-bright font-semibold',
    danger: 'bg-danger/10 border border-danger/30 text-danger font-semibold',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl transition-all active:scale-[0.97] active:brightness-95 disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Chip({
  children, selected = false, onClick, tone = 'default', className = '',
}: {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  tone?: 'default' | 'good' | 'bad' | 'warn'
  className?: string
}) {
  const tones = {
    default: selected
      ? 'bg-gradient-to-b from-accent-bright to-accent-deep text-[#04130d] border-transparent font-bold shadow-[0_4px_14px_-4px_rgba(16,185,129,0.5)]'
      : 'bg-surface-2 border-line text-muted',
    good: selected ? 'bg-accent text-[#04130d] border-accent font-bold' : 'bg-surface-2 border-accent/30 text-accent-bright',
    bad: selected ? 'bg-danger text-[#180606] border-danger font-bold' : 'bg-surface-2 border-danger/30 text-danger',
    warn: selected ? 'bg-gold text-[#1a1303] border-gold font-bold' : 'bg-surface-2 border-gold/30 text-gold',
  }
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-[13px] min-h-[38px] transition-all active:scale-95 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

// ── Stat display ────────────────────────────────────────────────────────

export function StatCard({
  label, value, sub, tone = 'default', className = '',
}: { label: string; value: ReactNode; sub?: string; tone?: 'default' | 'good' | 'bad' | 'gold'; className?: string }) {
  const tones = { default: 'text-ink', good: 'text-accent-bright', bad: 'text-danger', gold: 'text-gold' }
  return (
    <Card className={`flex flex-col gap-0.5 ${className}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className={`text-2xl font-extrabold tracking-tight tabular-nums ${tones[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-muted leading-snug">{sub}</div>}
    </Card>
  )
}

// ── Meters & rings ─────────────────────────────────────────────────────

export function Meter({
  value, tone = 'auto', label, className = '',
}: { value: number; tone?: 'auto' | 'good' | 'bad'; label?: string; className?: string }) {
  const v = Math.min(100, Math.max(0, value))
  const color =
    tone === 'good'
      ? 'bg-gradient-to-r from-accent-deep to-accent-bright'
      : tone === 'bad'
        ? 'bg-gradient-to-r from-danger/70 to-danger'
        : v < 35
          ? 'bg-gradient-to-r from-accent-deep to-accent-bright'
          : v < 65
            ? 'bg-gradient-to-r from-gold/70 to-gold'
            : 'bg-gradient-to-r from-danger/70 to-danger'
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-[11px] text-muted mb-1">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(v)}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}

let ringIdSeq = 0

export function ProgressRing({
  value, size = 96, stroke = 8, label, sub,
}: { value: number; size?: number; stroke?: number; label?: string; sub?: string }) {
  // lazy id: evaluated once per instance, not on every render
  const id = useMemo(() => `ring-${++ringIdSeq}`, [])
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.min(100, Math.max(0, value))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)}
          className="transition-all duration-700 drop-shadow-[0_0_6px_rgba(16,185,129,0.45)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold tracking-tight tabular-nums">{label ?? Math.round(v)}</span>
        {sub && <span className="text-[10px] uppercase tracking-wider text-faint">{sub}</span>}
      </div>
    </div>
  )
}

// ── Bottom sheet (swipe-down to dismiss) ───────────────────────────────

export function Sheet({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const [dragY, setDragY] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) setDragY(0)
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div
        className="relative w-full max-w-md md:max-w-xl max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-x border-line-bright bg-surface shadow-[var(--shadow-float)] animate-rise pb-[max(env(safe-area-inset-bottom),16px)]"
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        <div
          className="sticky top-0 z-10 bg-surface/95 backdrop-blur pt-3 pb-2 px-5 border-b border-line/60 touch-none"
          onTouchStart={(e) => {
            startRef.current = e.touches[0].clientY
          }}
          onTouchMove={(e) => {
            if (startRef.current == null) return
            setDragY(Math.max(0, e.touches[0].clientY - startRef.current))
          }}
          onTouchEnd={() => {
            if (dragY > 80) onClose()
            setDragY(0)
            startRef.current = null
          }}
        >
          <div className="mx-auto mb-2.5 h-1.5 w-12 rounded-full bg-surface-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight">{title}</h3>
            <button onClick={onClose} className="text-muted text-sm px-3 py-2 -mr-2 active:scale-95">Close</button>
          </div>
        </div>
        <div className="px-5 pt-4 pb-2">{children}</div>
      </div>
    </div>
  )
}

// ── Segmented control (animated thumb) ─────────────────────────────────

export function Segmented<T extends string>({
  options, value, onChange, className = '',
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className={`relative flex rounded-xl bg-surface-2 border border-line p-1 ${className}`}>
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-b from-accent-bright to-accent-deep shadow-[0_2px_10px_-2px_rgba(16,185,129,0.5)] transition-transform duration-200 ease-out"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${idx * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 flex-1 rounded-lg px-2 py-2 text-[13px] min-h-[38px] transition-colors duration-200 ${value === o.value ? 'text-[#04130d] font-bold' : 'text-muted font-medium'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Misc ───────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, sub, action }: { icon: string; title: string; sub: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center text-center py-10 gap-2">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 border border-line text-3xl">{icon}</div>
      <div className="font-bold tracking-tight mt-1">{title}</div>
      <div className="text-sm text-muted max-w-[270px] leading-relaxed">{sub}</div>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  )
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'good' | 'bad' | 'gold' | 'info' }) {
  const tones = {
    default: 'bg-surface-3 text-muted',
    good: 'bg-accent/15 text-accent-bright',
    bad: 'bg-danger/15 text-danger',
    gold: 'bg-gold/15 text-gold',
    info: 'bg-info/15 text-info',
  }
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}>{children}</span>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold text-muted mb-1.5">{label}</div>
      {children}
    </label>
  )
}

/* 16px font prevents iOS auto-zoom on focus */
export const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[16px] text-ink placeholder-faint outline-none focus:border-accent/60 focus:bg-surface transition-colors min-h-[48px]'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}
