import type { ReactNode } from 'react'
import type { Tab } from '../types'
import { BottomNav } from './BottomNav'

export function AppShell({
  tab, onTabChange, children, title, subtitle,
}: { tab: Tab; onTabChange: (t: Tab) => void; children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md md:max-w-xl lg:max-w-2xl">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/85 backdrop-blur-md px-[max(env(safe-area-inset-left),16px)] pr-[max(env(safe-area-inset-right),16px)] pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <div className="flex items-end justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-[12px] text-muted mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2.5 shrink-0 pl-3">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent-bright drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M10 3v12.5M10 3l7 2.2L10 8" />
                <ellipse cx="11.5" cy="18.5" rx="5" ry="1.8" />
              </svg>
              <span className="text-[12px] font-extrabold tracking-wide bg-gradient-to-r from-accent-bright to-info bg-clip-text text-transparent">
                TrueCaddie
              </span>
            </div>
            <button
              onClick={() => onTabChange('profile')}
              aria-label="Profile"
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all active:scale-95 ${tab === 'profile' ? 'border-accent text-accent-bright bg-accent/10 shadow-[0_0_14px_-2px_rgba(16,185,129,0.5)]' : 'border-line text-muted'}`}
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <main className="px-[max(env(safe-area-inset-left),16px)] pr-[max(env(safe-area-inset-right),16px)] pb-32 pt-3">{children}</main>
      <BottomNav tab={tab} onChange={onTabChange} />
    </div>
  )
}
