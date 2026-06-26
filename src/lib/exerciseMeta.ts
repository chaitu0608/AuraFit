import { LB, norm } from './utils'
import type { ExerciseMeta, ExerciseType, Session } from './types'
import { resolve } from './sets'

const metaStore = new Map<string, ExerciseMeta>()

export function setMetaStore(store: Map<string, ExerciseMeta>) {
  metaStore.clear()
  store.forEach((v, k) => metaStore.set(k, v))
}

export function exMeta(name: string): ExerciseMeta | null {
  return metaStore.get(norm(name)) || null
}

export function exType(name: string): ExerciseType {
  const m = exMeta(name)
  return m ? m.type : 'dumbbell'
}

export function plateKg(name: string): number {
  const m = exMeta(name)
  const pl = (m && m.plate) || { n: 5, unit: 'lb' as const }
  return pl.unit === 'lb' ? pl.n * LB : pl.n
}

export function guessSupport(name: string): boolean {
  return /pull[ -]?up|chin[ -]?up|\bdip/.test(norm(name))
}

export function guessType(name: string, sessions: Record<string, Session> = {}): ExerciseType {
  const k = norm(name)
  if (/chest (fly|press)|lat ?pull|pull ?down|face pull|pec|cable|machine/.test(k))
    return 'machine'
  if (/pull[ -]?up|chin[ -]?up|push[ -]?up|\bdip/.test(k)) return 'free'
  let sawW = false,
    sawR = false
  Object.values(sessions).forEach((s) =>
    (s.exercises || []).forEach((ex) => {
      if (norm(ex.name) === k)
        (ex.sets || []).forEach((st) => {
          const r = resolve(st)
          if (r.w != null || r.p != null) sawW = true
          if (r.r != null) sawR = true
        })
    }),
  )
  if (sawR && !sawW) return 'free'
  return 'dumbbell'
}

export function defaultMeta(name: string, sessions: Record<string, Session> = {}): ExerciseMeta {
  const t = guessType(name, sessions)
  const m: ExerciseMeta = { type: t, unit: t === 'dumbbell' ? 'kg' : '' }
  if (t === 'machine') m.plate = { n: 5, unit: 'lb' }
  if (t === 'free') m.support = guessSupport(name)
  return m
}

export function ensureMeta(
  name: string,
  sessions: Record<string, Session> = {},
): ExerciseMeta {
  const k = norm(name)
  if (!k) return defaultMeta(name, sessions)
  if (!metaStore.has(k)) metaStore.set(k, defaultMeta(name, sessions))
  return metaStore.get(k)!
}
