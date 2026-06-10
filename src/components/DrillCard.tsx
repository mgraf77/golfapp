import { useState } from 'react'
import type { Drill } from '../types'
import { Badge, Card } from './ui'

export function DrillCard({ drill, highlight = false, reason }: { drill: Drill; highlight?: boolean; reason?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className={highlight ? 'border-accent/40' : ''} onClick={() => setOpen(!open)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[15px]">{drill.name}</span>
            {highlight && <Badge tone="good">Recommended</Badge>}
          </div>
          <div className="mt-1 text-[13px] text-muted leading-snug">{drill.objective}</div>
          {reason && <div className="mt-1.5 text-[12px] text-accent-bright">{reason}</div>}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[12px] font-semibold text-muted">{drill.minutes} min</div>
          <div className="text-[10px] uppercase tracking-wider text-faint">{drill.category}</div>
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-2.5 border-t border-line pt-3 text-[13px] animate-fade">
          <DrillRow label="Setup" text={drill.setup} />
          <DrillRow label="Reps" text={drill.reps} />
          <DrillRow label="Scoring" text={drill.scoring} />
          <DrillRow label="Track" text={drill.track} />
          <DrillRow label="Success" text={drill.success} />
          <DrillRow label="Coaching cue" text={drill.cue} accent />
          <DrillRow label="Progress when" text={drill.progression} />
        </div>
      )}
      <div className="mt-2 text-center text-[11px] text-faint">{open ? 'Tap to collapse' : 'Tap for full protocol'}</div>
    </Card>
  )
}

function DrillRow({ label, text, accent = false }: { label: string; text: string; accent?: boolean }) {
  return (
    <div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-faint">{label}</span>
      <p className={`mt-0.5 leading-snug ${accent ? 'text-accent-bright' : 'text-ink'}`}>{text}</p>
    </div>
  )
}
