import { useEffect, useRef, useState } from 'react'
import type { Lesson } from '../data/lessons'
import { LESSON_CATEGORIES } from '../data/lessons'
import { getDrill } from '../data/drills'
import { DrillCard } from './DrillCard'
import { Badge, Button } from './ui'

/**
 * Full-screen mobile lesson reader: reading progress bar, scannable
 * sections (why it matters → keys → steps → mistakes → feel vs real →
 * checkpoints you can tick off), and the video one thumb-tap away.
 */

interface Props {
  lesson: Lesson
  onClose: () => void
  onWatch: () => void
  onNext?: (() => void) | null
  nextTitle?: string
}

export function LessonReader({ lesson, onClose, onWatch, onNext, nextTitle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const cat = LESSON_CATEGORIES.find((c) => c.id === lesson.category)

  // reset + scroll top when the lesson changes
  useEffect(() => {
    setChecked(new Set())
    setProgress(0)
    scrollRef.current?.scrollTo({ top: 0 })
  }, [lesson.id])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setProgress(max > 0 ? el.scrollTop / max : 1)
  }

  const toggleCheck = (i: number) =>
    setChecked((s) => {
      const n = new Set(s)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })

  return (
    <div className="fixed inset-0 z-[55] bg-bg flex flex-col">
      {/* header */}
      <div className="shrink-0 border-b border-line bg-bg/95 backdrop-blur pt-[max(env(safe-area-inset-top),10px)]">
        <div className="mx-auto w-full max-w-md md:max-w-xl flex items-center gap-2 px-4 pb-2.5">
          <button onClick={onClose} aria-label="Back" className="h-9 w-9 -ml-1 shrink-0 rounded-full text-muted text-lg active:bg-surface-2">
            ←
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-accent-bright font-bold">
              {cat?.icon} {cat?.label} · {lesson.minutes} min
            </div>
            <div className="text-[15px] font-bold leading-tight truncate">{lesson.title}</div>
          </div>
          <Badge tone={lesson.level === 'beginner' ? 'good' : lesson.level === 'intermediate' ? 'gold' : 'bad'}>
            {lesson.level}
          </Badge>
        </div>
        <div className="h-0.5 bg-surface-2">
          <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* body */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-md md:max-w-xl px-4 pb-36 pt-4">
          <p className="text-[15px] text-muted leading-relaxed">{lesson.summary}</p>

          {/* why it matters */}
          <Section icon="📊" title="Why it matters">
            <div className="rounded-2xl border border-info/25 bg-info/5 p-4">
              <p className="text-[14px] leading-relaxed text-ink/90">{lesson.whyItMatters}</p>
            </div>
          </Section>

          {/* keys */}
          <Section icon="🔑" title="The keys">
            <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
              <ul className="flex flex-col gap-2.5">
                {lesson.keys.map((k, i) => (
                  <li key={i} className="text-[14px] leading-snug flex gap-2.5">
                    <span className="text-accent-bright font-bold shrink-0">{i + 1}.</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* steps */}
          <Section icon="🛠" title="How to build it">
            <div className="flex flex-col gap-4">
              {lesson.steps.map((s, i) => (
                <div key={i} className="relative pl-9">
                  <div className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-surface-3 text-[12px] font-bold text-accent-bright">
                    {i + 1}
                  </div>
                  {i < lesson.steps.length - 1 && <div className="absolute left-3 top-7 bottom-[-12px] w-px bg-line" />}
                  <div className="font-semibold text-[15px] leading-snug">{s.heading}</div>
                  <p className="text-[14px] text-muted leading-relaxed mt-1">{s.body}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* mistakes */}
          <Section icon="⚠️" title="Common mistakes">
            <div className="flex flex-col gap-2.5">
              {lesson.mistakes.map((m, i) => (
                <div key={i} className="rounded-2xl border border-line bg-surface p-3.5">
                  <div className="flex gap-2 text-[14px] leading-snug">
                    <span className="text-danger shrink-0">✗</span>
                    <span className="text-ink/90">{m.wrong}</span>
                  </div>
                  <div className="flex gap-2 text-[13px] leading-relaxed mt-1.5 text-muted">
                    <span className="text-accent-bright shrink-0">→</span>
                    <span>{m.fix}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* feel vs real */}
          <Section icon="🪞" title="Feel vs real">
            <p className="text-[12px] text-faint mb-2 -mt-1">What it should FEEL like vs what's actually happening — feels are personal, these are proven starters.</p>
            <div className="flex flex-col gap-2.5">
              {lesson.feels.map((f, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-line bg-surface p-3.5">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Feel</div>
                    <div className="text-[13px] leading-snug">{f.feel}</div>
                  </div>
                  <div className="text-faint">⇄</div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-accent-bright font-bold mb-1">Real</div>
                    <div className="text-[13px] leading-snug text-muted">{f.real}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* checkpoints */}
          <Section icon="✅" title="Checkpoints" sub={`${checked.size}/${lesson.checkpoints.length} — tap as you verify them`}>
            <div className="flex flex-col gap-2">
              {lesson.checkpoints.map((c, i) => {
                const on = checked.has(i)
                return (
                  <button
                    key={i}
                    onClick={() => toggleCheck(i)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] ${on ? 'border-accent/50 bg-accent/8' : 'border-line bg-surface'}`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-[13px] font-bold ${on ? 'border-accent bg-accent text-[#04130d]' : 'border-line text-transparent'}`}>
                      ✓
                    </span>
                    <span className={`text-[14px] leading-snug ${on ? 'text-ink' : 'text-muted'}`}>{c}</span>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* pro tip */}
          <Section icon="💎" title="Pro tip">
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
              <p className="text-[14px] leading-relaxed">{lesson.proTip}</p>
            </div>
          </Section>

          {/* drills */}
          {lesson.drillIds.length > 0 && (
            <Section icon="🏋️" title="Train it">
              <div className="flex flex-col gap-2.5">
                {lesson.drillIds.slice(0, 3).map((d) => (
                  <DrillCard key={d} drill={getDrill(d)} />
                ))}
              </div>
            </Section>
          )}

          <p className="mt-8 text-center text-[11px] text-faint">Drawing on: {lesson.source}</p>

          {onNext && nextTitle && (
            <button onClick={onNext} className="mt-6 w-full rounded-2xl border border-line bg-surface p-4 text-left active:scale-[0.99] transition-transform">
              <div className="text-[10px] uppercase tracking-wider text-faint font-bold">Next lesson</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[14px] font-semibold">{nextTitle}</span>
                <span className="text-accent-bright">→</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* sticky action bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-8 pb-[max(env(safe-area-inset-bottom),14px)] px-4 pointer-events-none">
        <div className="mx-auto w-full max-w-md md:max-w-xl pointer-events-auto">
          <Button size="lg" className="w-full shadow-[0_8px_30px_-6px_rgba(16,185,129,0.45)]" onClick={onWatch}>
            ▶ Watch the AI video · {lesson.minutes > 9 ? '90' : '60'} sec
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
          <span className="mr-1.5">{icon}</span>
          {title}
        </h2>
        {sub && <span className="text-[11px] text-faint">{sub}</span>}
      </div>
      {children}
    </div>
  )
}
