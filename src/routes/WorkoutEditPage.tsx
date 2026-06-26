import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Card'
import { useDataStore } from '@/stores/dataStore'
import { usePersist } from '@/hooks/usePersist'
import { ensureMeta } from '@/lib/exerciseMeta'

export function WorkoutEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const templates = useDataStore((s) => s.templates)
  const { persistTemplate, removeTemplate } = usePersist()
  const t = templates.find((x) => x.id === id)

  if (!t) {
    navigate('/workouts')
    return null
  }

  function update(patch: Partial<typeof t>) {
    persistTemplate({ ...t!, ...patch })
  }

  return (
    <AppShell title="Edit workout" showBack onBack={() => navigate('/workouts')}>
      <Field label="Workout name">
        <Input
          value={t.name}
          placeholder="e.g. Legs 1, Push A"
          onChange={(e) => update({ name: e.target.value })}
        />
      </Field>
      <div className="eyebrow">Exercises</div>
      {t.exercises.length ? (
        t.exercises.map((ex, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span className="num text-faint text-xs w-5 text-center">{i + 1}</span>
            <Input
              value={ex}
              list="exlist"
              onChange={(e) => {
                const exercises = [...t.exercises]
                exercises[i] = e.target.value
                update({ exercises })
              }}
              onBlur={() => ensureMeta(ex)}
            />
            <button
              type="button"
              className="mini w-[34px] h-[34px] rounded-lg border border-line text-muted"
              onClick={() => update({ exercises: t.exercises.filter((_, j) => j !== i) })}
            >
              ×
            </button>
          </div>
        ))
      ) : (
        <p className="text-muted text-sm mb-2.5">No exercises yet.</p>
      )}
      <Button
        variant="ghost"
        onClick={() => update({ exercises: [...t.exercises, ''] })}
      >
        <span className="text-lg">+</span> Add exercise
      </Button>
      <div className="h-px bg-line my-4" />
      <Button
        variant="danger"
        onClick={() => {
          if (confirm(`Delete "${t.name || 'this workout'}"?`)) {
            removeTemplate(t.id!)
            navigate('/workouts')
          }
        }}
      >
        Delete this workout
      </Button>
    </AppShell>
  )
}
