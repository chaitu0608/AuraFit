import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, Heart, Plus, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Field, Card, SectionHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ExerciseCard } from '@/features/logging/ExerciseCard'
import { TemplatePicker } from '@/features/logging/TemplatePicker'
import { HealthKitBanner } from '@/features/healthkit/HealthKitBanner'
import { HeartRateSparkline } from '@/features/healthkit/HeartRateSparkline'
import { useDataStore } from '@/stores/dataStore'
import { usePersist } from '@/hooks/usePersist'
import { pretty } from '@/lib/utils'
import { newSet } from '@/lib/sets'
import { writeStrengthWorkout } from '@/lib/healthkit'
import { useFadeIn } from '@/components/anime/hooks'
import type { Session } from '@/lib/types'

function ensureSession(sessions: Record<string, Session>, k: string): Session {
  if (!sessions[k]) {
    return { id: crypto.randomUUID(), date: k, kind: 'workout', name: null, exercises: [], notes: '' }
  }
  return { ...sessions[k] }
}

export function DayPage() {
  const { dateKey = '' } = useParams()
  const navigate = useNavigate()
  const sessions = useDataStore((s) => s.sessions)
  const { persistSession, removeSession } = usePersist()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pageRef = useFadeIn<HTMLDivElement>([dateKey])
  const session = dateKey ? sessions[dateKey] : undefined

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [dateKey])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  function updateSession(next: Session) {
    if (!dateKey) return
    persistSession(dateKey, next)
  }

  function startBlank() {
    const s = ensureSession(sessions, dateKey!)
    s.kind = 'workout'
    s.name = null
    s.exercises = [{ name: '', sets: [newSet()] }]
    updateSession(s)
  }

  function startCardio() {
    const s = ensureSession(sessions, dateKey!)
    s.kind = 'cardio'
    s.exercises = []
    updateSession(s)
  }

  function startRest() {
    const s = ensureSession(sessions, dateKey!)
    s.kind = 'rest'
    s.exercises = []
    updateSession(s)
    navigate('/')
  }

  function loadTemplate(names: string[], name: string) {
    const s = ensureSession(sessions, dateKey!)
    s.kind = 'workout'
    s.name = name
    s.exercises = names.map((n) => ({ name: n, sets: [newSet()] }))
    updateSession(s)
    setPickerOpen(false)
  }

  async function saveToHealthKit(s: Session) {
    const start = new Date(dateKey + 'T08:00:00').toISOString()
    const end = new Date(dateKey + 'T09:30:00').toISOString()
    const uuid = await writeStrengthWorkout({ startDate: start, endDate: end })
    if (uuid) updateSession({ ...s, source: 'healthkit', healthkit_uuid: uuid })
  }

  if (!dateKey) return null

  if (!session) {
    return (
      <AppShell title={pretty(dateKey)} showBack onBack={() => navigate('/')} fab={false}>
        <div ref={pageRef}>
          <HealthKitBanner dateKey={dateKey} onImport={startBlank} />
          <p className="text-muted text-sm mb-6">Choose how to log this session.</p>
          <div className="grid gap-2.5">
            <Button variant="primary" onClick={() => setPickerOpen(true)}>
              Start from routine
            </Button>
            <Button variant="secondary" onClick={startBlank}>
              Empty workout
            </Button>
            <Button variant="secondary" onClick={startCardio}>
              Cardio
            </Button>
            <Button variant="ghost" onClick={startRest}>
              Rest day
            </Button>
          </div>
        </div>
        {pickerOpen && <TemplatePicker onPick={loadTemplate} onClose={() => setPickerOpen(false)} />}
      </AppShell>
    )
  }

  if (session.kind === 'rest' || session.kind === 'cardio') {
    return (
      <AppShell title={pretty(dateKey)} showBack onBack={() => navigate('/')} fab={false}>
        <Card>
          <Badge tone={session.kind === 'rest' ? 'default' : 'cardio'}>{session.kind}</Badge>
          <p className="text-muted text-sm mt-3">{pretty(dateKey)}</p>
        </Card>
        {session.kind === 'cardio' && (
          <Field label="Session notes">
            <Textarea
              rows={3}
              placeholder="e.g. 30 min incline walk"
              value={session.notes || ''}
              onChange={(e) => updateSession({ ...session, notes: e.target.value })}
            />
          </Field>
        )}
        <Button variant="danger" onClick={() => { if (confirm('Clear?')) { removeSession(dateKey); navigate('/') } }}>
          Clear day
        </Button>
      </AppShell>
    )
  }

  const exercises = session.exercises || []

  function patchSession(patch: Partial<Session>) {
    if (!session) return
    updateSession({ ...session, date: dateKey, ...patch })
  }

  return (
    <AppShell
      title={session.name || 'Active workout'}
      subtitle={pretty(dateKey)}
      showBack
      onBack={() => navigate('/')}
      fab={false}
    >
      <div ref={pageRef}>
        <div className="flex items-center gap-3 mb-4">
          <div className="stat-tile flex-1 flex-row items-center gap-2 !py-2.5">
            <Clock size={16} className="text-accent" />
            <span className="num text-lg font-semibold">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
          <Badge tone="accent">{exercises.length} exercises</Badge>
        </div>

        <HealthKitBanner dateKey={dateKey} onImport={() => {}} />
        {session.healthkit_uuid && (
          <HeartRateSparkline start={dateKey + 'T08:00:00'} end={dateKey + 'T09:30:00'} />
        )}

        <SectionHeader title="Exercises" />
        {exercises.map((ex, ei) => (
          <ExerciseCard
            key={ei}
            exercise={ex}
            dateKey={dateKey}
            sessions={sessions}
            index={ei}
            onChange={(updated) => {
              const next = [...exercises]
              next[ei] = updated
              patchSession({ exercises: next })
            }}
            onRemove={() => patchSession({ exercises: exercises.filter((_, i) => i !== ei) })}
            onMoveUp={() => {
              if (ei === 0) return
              const next = [...exercises]
              ;[next[ei - 1], next[ei]] = [next[ei], next[ei - 1]]
              patchSession({ exercises: next })
            }}
            onMoveDown={() => {
              if (ei >= exercises.length - 1) return
              const next = [...exercises]
              ;[next[ei], next[ei + 1]] = [next[ei + 1], next[ei]]
              patchSession({ exercises: next })
            }}
          />
        ))}

        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => patchSession({ exercises: [...exercises, { name: '', sets: [newSet()] }] })}
        >
          <Plus size={18} /> Add exercise
        </Button>

        <Field label="Session notes">
          <Textarea
            rows={2}
            placeholder="How did it feel?"
            value={session.notes || ''}
            onChange={(e) => patchSession({ notes: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const names = exercises.map((e) => e.name.trim()).filter(Boolean)
              if (!names.length) return alert('Add exercises first')
              const nm = prompt('Routine name:', session.name || '')
              if (nm === null) return
              const templates = useDataStore.getState().templates
              useDataStore.getState().setTemplates([
                ...templates,
                { id: crypto.randomUUID(), name: nm.trim() || 'Untitled', exercises: names },
              ])
              patchSession({ name: nm.trim() })
            }}
          >
            Save routine
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { if (confirm('Clear?')) { removeSession(dateKey); navigate('/') } }}
          >
            <Trash2 size={16} /> Clear
          </Button>
        </div>
        <Button variant="primary" onClick={() => saveToHealthKit(session)}>
          <Heart size={18} /> Sync to Apple Health
        </Button>
      </div>
    </AppShell>
  )
}
