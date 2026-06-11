import type { Tab } from '../types'

const TABS: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.3 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    ),
  },
  {
    id: 'play',
    label: 'Play',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.3 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v13.5M8 3l8 2.5L8 9" />
        <ellipse cx="10" cy="19" rx="6" ry="2.2" />
      </svg>
    ),
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.3 : 1.8}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'swing',
    label: 'Swing',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.3 : 1.8}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m10 9.5 5 2.5-5 2.5v-5Z" />
      </svg>
    ),
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a ? 2.3 : 1.8}>
        <path strokeLinecap="round" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
]

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const select = (t: Tab) => {
    if (t !== tab && 'vibrate' in navigator) navigator.vibrate?.(8)
    onChange(t)
  }
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md md:max-w-xl lg:max-w-2xl -translate-x-1/2 border-t border-line bg-bg/90 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="flex px-[max(env(safe-area-inset-left),0px)] pr-[max(env(safe-area-inset-right),0px)]">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 pt-2.5 pb-1.5 min-h-[56px] transition-colors ${active ? 'text-accent-bright' : 'text-faint active:text-muted'}`}
            >
              <span
                className={`absolute top-0 h-[3px] w-9 rounded-b-full bg-gradient-to-r from-accent-bright to-accent transition-all duration-300 ${active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'}`}
              />
              <span className={`transition-transform duration-200 ${active ? '-translate-y-0.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.45)]' : ''}`}>
                {t.icon(active)}
              </span>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
