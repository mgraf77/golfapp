import type { Tab } from '../types'

const TABS: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    ),
  },
  {
    id: 'play',
    label: 'Play',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v13.5M8 3l8 2.5L8 9" />
        <ellipse cx="10" cy="19" rx="6" ry="2.2" />
      </svg>
    ),
  },
  {
    id: 'range',
    label: 'Range',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}>
        <path strokeLinecap="round" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}>
        <circle cx="12" cy="8" r="4" />
        <path strokeLinecap="round" d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" />
      </svg>
    ),
  },
]

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-line bg-bg/90 backdrop-blur-lg pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="flex">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 pt-2.5 pb-1 transition-colors ${active ? 'text-accent-bright' : 'text-faint'}`}
            >
              {t.icon(active)}
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
