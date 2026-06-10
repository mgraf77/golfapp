import type { ReactNode } from 'react'

/** AI coach speech card — used after shots, in summaries, on the dashboard. */
export function FeedbackCard({
  children, title = 'AI Caddie', tone = 'default', className = '',
}: { children: ReactNode; title?: string; tone?: 'default' | 'good' | 'warn'; className?: string }) {
  const border = tone === 'good' ? 'border-accent/40' : tone === 'warn' ? 'border-gold/40' : 'border-line'
  return (
    <div className={`rounded-2xl border ${border} bg-surface-2 p-4 animate-pop ${className}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
          <span className="h-2 w-2 rounded-full bg-accent-bright animate-pulse" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent-bright">{title}</span>
      </div>
      <div className="text-[14px] leading-relaxed text-ink">{children}</div>
    </div>
  )
}
