import { useState } from 'react'
import type { Lesson } from '../data/lessons'
import { DRILLS } from '../data/drills'
import { LESSON_CATEGORIES, LESSONS } from '../data/lessons'
import { getStoryboard, hasCustomVideo } from '../lib/storyboards'
import { useActiveRange } from '../hooks/useAppState'
import { DrillCard } from '../components/DrillCard'
import { GreenReader } from '../components/GreenReader'
import { LessonReader } from '../components/LessonReader'
import { LessonVideo } from '../components/LessonVideo'
import { Badge, Card, Segmented } from '../components/ui'
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
  const [video, setVideo] = useState<Lesson | null>(null)
  const [greens, setGreens] = useState(false)
  const list = LESSONS.filter((l) => cat === 'all' || l.category === cat)
  const featured = LESSONS.filter((l) => hasCustomVideo(l.id)).slice(0, 8)
  const catIcon = (id: Lesson['category']) => LESSON_CATEGORIES.find((c) => c.id === id)?.icon ?? '⛳'

  const openIdx = open ? list.findIndex((l) => l.id === open.id) : -1
  const nextLesson = openIdx >= 0 && openIdx < list.length - 1 ? list[openIdx + 1] : null

  return (
    <div>
      {/* AI video rail */}
      {cat === 'all' && (
        <>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">🎬 AI video lessons</span>
            <button onClick={() => setGreens(true)} className="text-[13px] font-semibold text-accent-bright">🟢 Green reading</button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1 mb-2">
            {featured.map((l) => (
              <button
                key={l.id}
                onClick={() => setVideo(l)}
                className="shrink-0 w-44 rounded-2xl border border-line bg-gradient-to-b from-surface-2 to-surface text-left p-3 active:scale-[0.97] transition-transform"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-9 w-9 rounded-full bg-accent text-[#04130d] flex items-center justify-center font-bold pl-0.5">▶</div>
                  <span className="text-base">{catIcon(l.category)}</span>
                </div>
                <div className="text-[13px] font-semibold leading-snug">{l.title.split(':')[0]}</div>
                <div className="text-[11px] text-faint mt-1">Narrated · ~90 sec</div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
        <button
          onClick={() => setCat('all')}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] ${cat === 'all' ? 'bg-accent text-[#04130d] border-accent font-semibold' : 'bg-surface-2 border-line text-muted'}`}
        >
          All {LESSONS.length}
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
          <Card key={l.id} onClick={() => setOpen(l)} className="!p-0 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="text-lg leading-none mt-0.5">{catIcon(l.category)}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-[14px] leading-snug">{l.title}</div>
                    <div className="text-[11px] text-faint mt-0.5">{l.minutes} min · {l.keys.length} keys · {l.checkpoints.length} checkpoints</div>
                  </div>
                </div>
                <Badge tone={l.level === 'beginner' ? 'good' : l.level === 'intermediate' ? 'gold' : 'bad'}>
                  {l.level}
                </Badge>
              </div>
              <p className="text-[13px] text-muted mt-2 leading-relaxed line-clamp-2">{l.summary}</p>
            </div>
            <div className="flex border-t border-line/60 divide-x divide-line/60">
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(l) }}
                className="flex-1 py-2.5 text-[13px] font-semibold text-muted active:bg-surface-2"
              >
                📖 Read
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setVideo(l) }}
                className="flex-1 py-2.5 text-[13px] font-semibold text-accent-bright active:bg-surface-2"
              >
                ▶ Watch
              </button>
            </div>
          </Card>
        ))}
      </div>

      {open && (
        <LessonReader
          lesson={open}
          onClose={() => setOpen(null)}
          onWatch={() => setVideo(open)}
          onNext={nextLesson ? () => setOpen(nextLesson) : null}
          nextTitle={nextLesson?.title}
        />
      )}

      {video && (
        <LessonVideo
          board={getStoryboard(video.id, video.title, video.keys, video.summary)}
          onClose={() => setVideo(null)}
        />
      )}
      <GreenReader open={greens} onClose={() => setGreens(false)} />
    </div>
  )
}
