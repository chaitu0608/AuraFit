import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useDataStore } from '@/stores/dataStore'
import { norm } from '@/lib/utils'
import { exType, ensureMeta } from '@/lib/exerciseMeta'

function allExerciseNames(sessions: ReturnType<typeof useDataStore.getState>['sessions']): string[] {
  const set = new Map<string, string>()
  Object.values(sessions).forEach((s) =>
    (s.exercises || []).forEach((ex) => {
      if (ex.name) set.set(norm(ex.name), ex.name.trim())
    }),
  )
  useDataStore.getState().templates.forEach((t) =>
    t.exercises.forEach((n) => {
      if (n) set.set(norm(n), n.trim())
    }),
  )
  return [...set.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}

export function ExerciseManagerPage() {
  const navigate = useNavigate()
  const sessions = useDataStore((s) => s.sessions)
  const [mergeFrom, setMergeFrom] = useState<string | null>(null)
  const names = allExerciseNames(sessions)

  async function renameExercise(oldName: string) {
    const nn = prompt(`Rename "${oldName}" to:`, oldName)
    if (!nn?.trim() || nn.trim() === oldName) return
    Object.keys(sessions).forEach((k) => {
      const s = sessions[k]
      if (!s.exercises) return
      s.exercises.forEach((ex) => {
        if (norm(ex.name) === norm(oldName)) ex.name = nn.trim()
      })
    })
    useDataStore.getState().setSessions({ ...sessions })
  }

  async function mergeExercise(from: string, into: string) {
    Object.keys(sessions).forEach((k) => {
      const s = sessions[k]
      if (!s.exercises) return
      const target = s.exercises.find((e) => norm(e.name) === norm(into))
      s.exercises.forEach((ex) => {
        if (norm(ex.name) === norm(from)) {
          if (target && target !== ex) {
            target.sets = target.sets.concat(ex.sets)
            ex.name = '__delete__'
          } else {
            ex.name = into
          }
        }
      })
      s.exercises = s.exercises.filter((e) => e.name !== '__delete__')
    })
    useDataStore.getState().setSessions({ ...sessions })
    setMergeFrom(null)
  }

  if (mergeFrom) {
    return (
      <AppShell title="Merge exercise" showBack onBack={() => setMergeFrom(null)}>
        <div className="banner bg-accent/10 border border-accent/35 rounded-r p-3 mb-3 text-sm">
          Merge <b>{mergeFrom}</b> into which exercise?
        </div>
        {names
          .filter((n) => norm(n) !== norm(mergeFrom))
          .map((n) => (
            <button
              key={n}
              type="button"
              className="exrow flex items-center gap-2 bg-surface border border-line rounded-[10px] p-2.5 mb-2 w-full text-left"
              onClick={() => {
                if (confirm(`Merge "${mergeFrom}" into "${n}"?`)) mergeExercise(mergeFrom, n)
              }}
            >
              <span className="flex-1 truncate">{n}</span>
              <span className="text-faint text-sm">merge here ›</span>
            </button>
          ))}
      </AppShell>
    )
  }

  return (
    <AppShell title="Exercises" showBack onBack={() => navigate('/settings')}>
      <p className="text-faint text-xs mb-3.5 ml-0.5">
        <b>Machine</b> = plates × reps · <b>Dumbbell</b> = kg × reps · <b>Free</b> = bodyweight reps
      </p>
      {names.length ? (
        names.map((n) => {
          const t = exType(n)
          ensureMeta(n, sessions)
          return (
            <div
              key={n}
              className="exrow flex items-center gap-2 bg-surface border border-line rounded-[10px] p-2.5 mb-2"
            >
              <span className="flex-1 truncate text-sm">{n}</span>
              <span className="text-xs text-muted">{t}</span>
              <button
                type="button"
                className="mini w-[34px] h-[34px] rounded-lg border border-line text-muted"
                onClick={() => renameExercise(n)}
              >
                ✎
              </button>
              <button
                type="button"
                className="mini w-[34px] h-[34px] rounded-lg border border-line text-muted"
                onClick={() => setMergeFrom(n)}
              >
                ⤲
              </button>
            </div>
          )
        })
      ) : (
        <p className="text-center text-muted py-8">No exercises yet.</p>
      )}
    </AppShell>
  )
}
