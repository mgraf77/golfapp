import { useState } from 'react'
import type { Lesson } from '../data/lessons'
import { DRILLS } from '../data/drills'
import { LESSON_CATEGORIES, LESSONS } from '../data/lessons'
import { useActiveRange } from '../hooks/useAppState'
import { DrillCard } from '../components/DrillCard'
import { Badge, Card, SectionTitle, Segmented, Sheet } from '../components/ui'
import { Range } from './Range'

/**
 * Practice hub: the live range coach, the full drill library, and the
 * lesson book — one tab for everything that builds the swing you take
 * to the course.
 */

export function Practice() {
  const activeRange = useActiveRange()
  const [view, setView] = useState<'range' | 'drills' | 'lessons'>('range')

  // a live range session takes over the tab
  if (activeRange) return <Range />

  return (
    <div className="animate-rise">
      <Segmented
        options={[
          { value: 'range', label: 'Range coach' },
          { value: 'drills', label: 'Drills' },
          { value: 'lessons', label: 'Lessons' },
        ]}
        value={view}
        onChange={setView}
        className="mb-3"
      />
      {view === 'range' && <Range />}
      {view === 'drills' && <DrillLibrary />}
      {view === 'lessons' && <LessonLibrary />}
    </div>
  )
}

function DrillLibrary() {
  const [cat, setCat] = useState<string>('all')
  const cats = ['all', ...new Set(DRILLS.map((d) => d.category))]
  const list = DRILLS.filter((d) => cat === 'all' || d.category === cat)
  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] capitalize ${cat === c ? 'bg-accent text-[#04130d] border-accent font-semibold' : 'bg-surface-2 border-line text-muted'}`}
          >
            {c.replace('-', ' ')}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {list.map((d) => (
          <DrillCard key={d.id} drill={d} />
        ))}
      </div>
    </div>
  )
}

function LessonLibrary() {
  const [cat, setCat] = useState<string>('all')
  const [open, setOpen] = useState<Lesson | null>(null)
  const list = LESSONS.filter((l) => cat === 'all' || l.category === cat)
  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
        <button
          onClick={() => setCat('all')}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] ${cat === 'all' ? 'bg-accent text-[#04130d] border-accent font-semibold' : 'bg-surface-2 border-line text-muted'}`}
        >
          All
        </button>
        {LESSON_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] ${cat === c.id ? 'bg-accent text-[#04130d] border-accent font-semibold' : 'bg-surface-2 border-line text-muted'}`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {list.map((l) => (
          <Card key={l.id} onClick={() => setOpen(l)}>
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-sm">{l.title}</div>
              <Badge tone={l.level === 'beginner' ? 'good' : l.level === 'intermediate' ? 'gold' : 'bad'}>
                {l.level}
              </Badge>
            </div>
            <p className="text-[13px] text-muted mt-1 leading-relaxed">{l.summary}</p>
            <div className="text-[11px] text-faint mt-1.5">{l.minutes} min read</div>
          </Card>
        ))}
      </div>

      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open?.title}>
        {open && <LessonView lesson={open} />}
      </Sheet>
    </div>
  )
}

function LessonView({ lesson }: { lesson: Lesson }) {
  return (
    <div className="pb-3">
      <p className="text-sm text-muted leading-relaxed">{lesson.summary}</p>

      <div className="mt-4 rounded-xl border border-accent/25 bg-accent/5 p-3.5">
        <div className="text-[11px] uppercase tracking-wider text-accent-bright font-semibold mb-2">Keys</div>
        <ul className="flex flex-col gap-1.5">
          {lesson.keys.map((k, i) => (
            <li key={i} className="text-[13px] leading-snug flex gap-2">
              <span className="text-accent-bright">✓</span>
              <span>{k}</span>
            </li>
          ))}
        </ul>
      </div>

      {lesson.steps.map((s, i) => (
        <div key={i} className="mt-4">
          <div className="font-semibold text-sm mb-1">
            <span className="text-accent-bright mr-1.5">{i + 1}.</span>
            {s.heading}
          </div>
          <p className="text-[13px] text-muted leading-relaxed">{s.body}</p>
        </div>
      ))}

      <div className="mt-4 rounded-xl border border-gold/25 bg-gold/5 p-3.5">
        <div className="text-[11px] uppercase tracking-wider text-gold font-semibold mb-1">Pro tip</div>
        <p className="text-[13px] leading-relaxed">{lesson.proTip}</p>
      </div>
    </div>
  )
}
