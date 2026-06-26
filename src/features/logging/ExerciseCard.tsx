import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Copy, GripVertical, Timer, Trophy, X } from 'lucide-react'
import { exType, exMeta, plateKg, ensureMeta } from '@/lib/exerciseMeta'
import { resolve, newSet } from '@/lib/sets'
import { summarise } from '@/lib/summarise'
import { bestBefore, lastSessionFor } from '@/lib/history'
import { suggestName } from '@/lib/fuzzy'
import { fmtKg, shortDate, norm, intOrNull, numOrNull } from '@/lib/utils'
import { animatePR, confettiBurst } from '@/components/anime/hooks'
import { Badge } from '@/components/ui/Badge'
import { Haptics, NotificationType } from '@capacitor/haptics'
import type { Session, SessionExercise } from '@/lib/types'

interface Props {
  exercise: SessionExercise
  dateKey: string
  sessions: Record<string, Session>
  index: number
  onChange: (ex: SessionExercise) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function allNames(sessions: Record<string, Session>): string[] {
  const set = new Map<string, string>()
  Object.values(sessions).forEach((s) =>
    (s.exercises || []).forEach((ex) => {
      if (ex.name) set.set(norm(ex.name), ex.name.trim())
    }),
  )
  return [...set.values()]
}

export function ExerciseCard({
  exercise,
  dateKey,
  sessions,
  index: _index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const prRef = useRef<HTMLSpanElement>(null)
  const [restSec, setRestSec] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const type = exType(exercise.name)
  const meta = exMeta(exercise.name)
  const last = exercise.name ? lastSessionFor(exercise.name, dateKey, sessions) : null
  const best = exercise.name ? bestBefore(exercise.name, dateKey, sessions) : -1
  const machine = type === 'machine'

  let isPR = false
  if (best >= 0) {
    exercise.sets.forEach((x) => {
      const r = resolve(x)
      const v = machine ? (r.p != null ? r.p : r.w) : r.w
      if (v != null && v > best) isPR = true
    })
  }

  useEffect(() => {
    if (!restSec || restSec <= 0) return
    const t = setInterval(() => setRestSec((s) => (s && s > 0 ? s - 1 : null)), 1000)
    return () => clearInterval(t)
  }, [restSec])

  useEffect(() => {
    if (isPR && prRef.current) {
      animatePR(prRef.current)
      confettiBurst(prRef.current.parentElement || document.body)
      Haptics.notification({ type: NotificationType.Success }).catch(() => {})
    }
  }, [isPR])

  const sug = suggestName(exercise.name, allNames(sessions))

  function updateSet(si: number, patch: Partial<SessionExercise['sets'][0]>) {
    const sets = [...exercise.sets]
    sets[si] = { ...sets[si], ...patch }
    onChange({ ...exercise, sets })
    if (patch.r != null || patch.w != null || patch.p != null) setRestSec(90)
  }

  function setRow(si: number) {
    const set = exercise.sets[si]
    const r = resolve(set)
    const ph = last?.sets[si] ? resolve(last.sets[si]) : null

    const rowClass =
      'grid grid-cols-[24px_1fr_auto] gap-2 items-center py-2 border-b border-line last:border-0'

    if (type === 'free') {
      return (
        <div key={si} className={rowClass}>
          <span className="num text-xs text-faint font-semibold text-center">{si + 1}</span>
          <div className="flex items-center gap-2">
            <input
              className="input-pro !py-2 !px-3 text-center num w-16"
              inputMode="numeric"
              value={r.r ?? ''}
              placeholder={ph?.r != null ? String(ph.r) : '—'}
              onChange={(e) => updateSet(si, { r: intOrNull(e.target.value) })}
            />
            <span className="text-xs text-muted">reps</span>
            {meta?.support && (
              <button
                type="button"
                className={`pill text-[10px] ${r.assisted ? 'bg-warn/15 text-warn' : 'bg-surface3 text-muted'}`}
                onClick={() => updateSet(si, { is_assisted: !r.assisted })}
              >
                {r.assisted ? 'Assisted' : 'Free'}
              </button>
            )}
          </div>
          <button type="button" className="icon-btn !w-8 !h-8 text-faint" onClick={() => {
            const sets = exercise.sets.filter((_, i) => i !== si)
            onChange({ ...exercise, sets: sets.length ? sets : [newSet()] })
          }}>
            <X size={14} />
          </button>
        </div>
      )
    }

    if (type === 'machine') {
      const pk = plateKg(exercise.name)
      const pcur = r.p != null ? r.p : r.w
      const kg = pcur != null ? fmtKg(pcur * pk) : '—'
      return (
        <div key={si} className={rowClass}>
          <span className="num text-xs text-faint font-semibold text-center">{si + 1}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <input
              className="input-pro !py-2 !px-2 text-center num w-14"
              inputMode="numeric"
              value={pcur ?? ''}
              onChange={(e) => updateSet(si, { p: intOrNull(e.target.value) })}
            />
            <span className="text-faint text-xs">pl →</span>
            <span className="text-xs font-medium text-accent num">{kg} kg</span>
            <span className="text-faint">×</span>
            <input
              className="input-pro !py-2 !px-2 text-center num w-14"
              inputMode="numeric"
              value={r.r ?? ''}
              onChange={(e) => updateSet(si, { r: intOrNull(e.target.value) })}
            />
          </div>
          <button type="button" className="icon-btn !w-8 !h-8 text-faint" onClick={() => {
            const sets = exercise.sets.filter((_, i) => i !== si)
            onChange({ ...exercise, sets: sets.length ? sets : [newSet()] })
          }}>
            <X size={14} />
          </button>
        </div>
      )
    }

    return (
      <div key={si} className={rowClass}>
        <span className="num text-xs text-faint font-semibold text-center">{si + 1}</span>
        <div className="flex items-center gap-1.5">
          <input
            className="input-pro !py-2 !px-2 text-center num w-14"
            inputMode="decimal"
            value={r.w ?? ''}
            onChange={(e) => updateSet(si, { w: numOrNull(e.target.value) })}
          />
          <span className="text-xs text-muted">kg ×</span>
          <input
            className="input-pro !py-2 !px-2 text-center num w-14"
            inputMode="numeric"
            value={r.r ?? ''}
            onChange={(e) => updateSet(si, { r: intOrNull(e.target.value) })}
          />
        </div>
        <button type="button" className="icon-btn !w-8 !h-8 text-faint" onClick={() => {
          const sets = exercise.sets.filter((_, i) => i !== si)
          onChange({ ...exercise, sets: sets.length ? sets : [newSet()] })
        }}>
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="card-pro mb-3 overflow-hidden">
      <div className="p-4 border-b border-line bg-surface2/50">
        <div className="flex items-start gap-2">
          <GripVertical size={16} className="text-faint mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-transparent text-[17px] font-semibold tracking-tight outline-none placeholder:text-faint"
              value={exercise.name}
              placeholder="Exercise name"
              list="exlist"
              onChange={(e) => onChange({ ...exercise, name: e.target.value })}
              onBlur={() => ensureMeta(exercise.name, sessions)}
            />
            {sug && norm(sug) !== norm(exercise.name) && (
              <button
                type="button"
                className="text-xs text-accent mt-1"
                onClick={() => onChange({ ...exercise, name: sug })}
              >
                Did you mean {sug}?
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button type="button" className="icon-btn !w-7 !h-7" onClick={onMoveUp}><ChevronUp size={14} /></button>
            <button type="button" className="icon-btn !w-7 !h-7" onClick={onMoveDown}><ChevronDown size={14} /></button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <select
            className="input-pro !py-1.5 !px-2 !w-auto text-xs"
            value={type}
            onChange={(e) => {
              if (!norm(exercise.name)) return
              ensureMeta(exercise.name, sessions)
              const m = ensureMeta(exercise.name, sessions)
              m.type = e.target.value as 'machine' | 'dumbbell' | 'free'
              onChange({ ...exercise })
            }}
          >
            <option value="machine">Machine</option>
            <option value="dumbbell">Dumbbell</option>
            <option value="free">Bodyweight</option>
          </select>
          {isPR && (
            <span ref={prRef}>
              <Badge tone="accent" className="gap-1">
                <Trophy size={12} /> PR
              </Badge>
            </span>
          )}
          {restSec != null && restSec > 0 && (
            <Badge tone="warn" className="gap-1">
              <Timer size={12} /> {restSec}s
            </Badge>
          )}
          <button type="button" className="ml-auto icon-btn !w-8 !h-8 text-danger" onClick={onRemove}>
            <X size={14} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 py-2">
          {exercise.name && last && (
            <div className="flex items-center gap-2 py-2 mb-1 rounded-rs bg-surface2/80 px-3">
              <span className="text-xs text-muted flex-1 truncate num">
                Last {shortDate(last.key)} · {summarise({ name: exercise.name, sets: last.sets })}
              </span>
              <button
                type="button"
                className="text-accent text-xs font-semibold flex items-center gap-1"
                onClick={() =>
                  onChange({
                    ...exercise,
                    sets: last.sets.map((s) => ({ ...s, id: undefined })),
                  })
                }
              >
                <Copy size={12} /> Copy
              </button>
            </div>
          )}
          {exercise.sets.map((_, si) => setRow(si))}
          <button
            type="button"
            className="text-sm text-accent font-medium py-2"
            onClick={() => onChange({ ...exercise, sets: [...exercise.sets, newSet()] })}
          >
            + Add set
          </button>
        </div>
      )}
      <button
        type="button"
        className="w-full py-2 text-xs text-faint border-t border-line"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </button>
    </div>
  )
}
