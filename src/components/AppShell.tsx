import type { ReactNode } from 'react'
import type { Tab } from '../types'
import { BottomNav } from './BottomNav'

export function AppShell({
  tab, onTabChange, children, title, subtitle,
}: { tab: Tab; onTabChange: (t: Tab) => void; children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md md:max-w-xl lg:max-w-2xl">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/85 backdrop-blur-lg px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-[12px] text-muted mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-accent-bright">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M10 3v12.5M10 3l7 2.2L10 8" />
                <ellipse cx="11.5" cy="18.5" rx="5" ry="1.8" />
              </svg>
              <span className="text-[12px] font-bold tracking-wide">TrueCaddie</span>
            </div>
            <button
              onClick={() => onTabChange('profile')}
              aria-label="Profile"
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${tab === 'profile' ? 'border-accent text-accent-bright bg-accent/10' : 'border-line text-muted'}`}
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <main className="px-4 pb-28 pt-3">{children}</main>
      <BottomNav tab={tab} onChange={onTabChange} />
    </div>
  )
}
