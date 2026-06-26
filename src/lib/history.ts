import { norm } from './utils'
import { exType, plateKg } from './exerciseMeta'
import { resolve } from './sets'
import type { Session, SessionExercise } from './types'

export function lastSessionFor(
  name: string,
  beforeKey: string,
  sessions: Record<string, Session>,
): { key: string; sets: SessionExercise['sets'] } | null {
  const keys = Object.keys(sessions)
    .filter((k) => k < beforeKey)
    .sort()
    .reverse()
  for (const k of keys) {
    const s = sessions[k]
    if (s && s.exercises)
      for (const ex of s.exercises) {
        if (
          norm(ex.name) === norm(name) &&
          (ex.sets || []).some((x) => {
            const r = resolve(x)
            return r.r != null || r.w != null || r.p != null
          })
        )
          return { key: k, sets: ex.sets }
      }
  }
  return null
}

export function bestBefore(
  name: string,
  beforeKey: string,
  sessions: Record<string, Session>,
): number {
  const machine = exType(name) === 'machine'
  let best = -1
  Object.keys(sessions)
    .filter((k) => k < beforeKey)
    .forEach((k) => {
      const s = sessions[k]
      if (!s || !s.exercises) return
      s.exercises.forEach((ex) => {
        if (norm(ex.name) === norm(name))
          ex.sets.forEach((x) => {
            const r = resolve(x)
            const v = machine ? (r.p != null ? r.p : r.w) : r.w
            if (v != null && v > best) best = v!
          })
      })
    })
  return best
}

export function historyFor(
  name: string,
  sessions: Record<string, Session>,
  summarise: (ex: SessionExercise) => string,
): { key: string; sum: string }[] {
  const out: { key: string; sum: string }[] = []
  Object.keys(sessions)
    .sort()
    .reverse()
    .forEach((k) => {
      const s = sessions[k]
      if (!s || !s.exercises) return
      s.exercises.forEach((ex) => {
        if (norm(ex.name) === norm(name)) {
          const sum = summarise(ex)
          if (sum) out.push({ key: k, sum })
        }
      })
    })
  return out
}

export function seriesFor(
  name: string,
  sessions: Record<string, Session>,
): { k: string; v: number }[] {
  const type = exType(name)
  const out: { k: string; v: number }[] = []
  Object.keys(sessions)
    .sort()
    .forEach((k) => {
      const s = sessions[k]
      if (!s || !s.exercises) return
      s.exercises.forEach((ex) => {
        if (norm(ex.name) === norm(name)) {
          let top: number | null = null
          ex.sets.map(resolve).forEach((r) => {
            const pv = r.p != null ? r.p : r.w
            const v =
              type === 'free' ? r.r : type === 'machine' ? (pv != null ? pv * plateKg(name) : null) : r.w
            if (v != null && (top == null || v > top)) top = v
          })
          if (top != null)
            out.push({ k, v: type === 'machine' ? Math.round(top * 10) / 10 : top })
        }
      })
    })
  return out
}
