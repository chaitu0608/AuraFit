import type { Session, SessionExercise, SetRow, Template } from '@/lib/types'
import { newSet } from '@/lib/sets'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RemoteSession = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RemoteTemplate = Record<string, any>

export function remoteSessionsToLocal(rows: RemoteSession[]): Record<string, Session> {
  const out: Record<string, Session> = {}
  for (const row of rows) {
    const date = String(row.date).slice(0, 10)
    const exercises: SessionExercise[] = (row.session_exercises || [])
      .sort((a: RemoteSession, b: RemoteSession) => (a.position ?? 0) - (b.position ?? 0))
      .map((se: RemoteSession) => ({
        id: se.id,
        exercise_id: se.exercise_id,
        name: se.exercises?.name || '',
        notes: se.notes,
        sets: (se.sets || [])
          .sort((a: RemoteSession, b: RemoteSession) => (a.position ?? 0) - (b.position ?? 0))
          .map(
            (s: RemoteSession): SetRow => ({
              id: s.id,
              w: s.weight_kg,
              r: s.reps,
              p: s.plates,
              is_assisted: s.is_assisted,
              drop_of_id: s.drop_of_id,
              rpe: s.rpe,
            }),
          ),
      }))
    if (!exercises.length && row.kind === 'workout') {
      exercises.push({ name: '', sets: [newSet()] })
    }
    out[date] = {
      id: row.id,
      user_id: row.user_id,
      date,
      kind: row.kind,
      name: row.name,
      notes: row.notes || '',
      source: row.source,
      healthkit_uuid: row.healthkit_uuid,
      exercises,
    }
  }
  return out
}

export function remoteTemplatesToLocal(rows: RemoteTemplate[]): Template[] {
  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    is_shared: row.is_shared,
    exercises: (row.template_exercises || [])
      .sort((a: RemoteTemplate, b: RemoteTemplate) => (a.position ?? 0) - (b.position ?? 0))
      .map((te: RemoteTemplate) => te.exercises?.name || '')
      .filter(Boolean),
  }))
}
