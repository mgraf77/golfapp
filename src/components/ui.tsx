import { useEffect, type ReactNode } from 'react'

// ── Card ────────────────────────────────────────────────────────────────

export function Card({
  children, className = '', onClick, glow = false,
}: { children: ReactNode; className?: string; onClick?: () => void; glow?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-line bg-surface p-4 ${glow ? 'shadow-[0_0_40px_-12px_rgba(16,185,129,0.25)]' : ''} ${onClick ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-2.5 px-0.5">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{children}</h2>
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
  const sizes = { sm: 'px-3 py-1.5 text-[13px]', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3.5 text-[15px]' }
  const variants = {
    primary: 'bg-accent text-[#04130d] font-semibold hover:bg-accent-bright',
    secondary: 'bg-surface-2 border border-line text-ink font-medium',
    ghost: 'text-accent-bright font-medium',
    danger: 'bg-danger/10 border border-danger/30 text-danger font-medium',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${className}`}
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
    default: selected ? 'bg-accent text-[#04130d] border-accent font-semibold' : 'bg-surface-2 border-line text-muted',
    good: selected ? 'bg-accent text-[#04130d] border-accent font-semibold' : 'bg-surface-2 border-accent/30 text-accent-bright',
    bad: selected ? 'bg-danger text-[#180606] border-danger font-semibold' : 'bg-surface-2 border-danger/30 text-danger',
    warn: selected ? 'bg-gold text-[#1a1303] border-gold font-semibold' : 'bg-surface-2 border-gold/30 text-gold',
  }
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-all active:scale-95 ${tones[tone]} ${className}`}
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
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${tones[tone]}`}>{value}</div>
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
    tone === 'good' ? 'bg-accent' : tone === 'bad' ? 'bg-danger' : v < 35 ? 'bg-accent' : v < 65 ? 'bg-gold' : 'bg-danger'
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

export function ProgressRing({
  value, size = 96, stroke = 8, label, sub,
}: { value: number; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.min(100, Math.max(0, value))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--color-accent)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{label ?? Math.round(v)}</span>
        {sub && <span className="text-[10px] uppercase tracking-wider text-faint">{sub}</span>}
      </div>
    </div>
  )
}

// ── Bottom sheet ────────────────────────────────────────────────────────

export function Sheet({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 animate-fade" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[88dvh] overflow-y-auto rounded-t-3xl border-t border-x border-line bg-surface animate-rise pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="sticky top-0 z-10 bg-surface pt-3 pb-2 px-5 border-b border-line/60">
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-surface-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{title}</h3>
            <button onClick={onClose} className="text-muted text-sm px-2 py-1 active:scale-95">Close</button>
          </div>
        </div>
        <div className="px-5 pt-4 pb-2">{children}</div>
      </div>
    </div>
  )
}

// ── Segmented control ───────────────────────────────────────────────────

export function Segmented<T extends string>({
  options, value, onChange, className = '',
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={`flex rounded-xl bg-surface-2 border border-line p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-[13px] transition-all ${value === o.value ? 'bg-accent text-[#04130d] font-semibold' : 'text-muted'}`}
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
      <div className="text-4xl">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted max-w-[260px]">{sub}</div>
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
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium text-muted mb-1.5">{label}</div>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[15px] text-ink placeholder-faint outline-none focus:border-accent/60 transition-colors'
