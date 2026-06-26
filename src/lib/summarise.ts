import { fmtKg, norm } from './utils'
import { exType, plateKg } from './exerciseMeta'
import { resolve } from './sets'
import type { SessionExercise } from './types'

export function summarise(ex: Pick<SessionExercise, 'name' | 'sets'>): string {
  const type = exType(ex.name)
  const rs = (ex.sets || []).map(resolve)
  if (type === 'free') {
    const f = rs.filter((s) => s.r != null)
    if (!f.length) return ''
    return f.map((s) => s.r + (s.assisted ? 'a' : '')).join(', ')
  }
  if (type === 'machine') {
    const pk = plateKg(ex.name)
    const pv = (s: ReturnType<typeof resolve>) => (s.p != null ? s.p : s.w)
    const f = rs.filter((s) => pv(s) != null || s.r != null)
    if (!f.length) return ''
    const kgs = [...new Set(f.map((s) => (pv(s) != null ? fmtKg(pv(s)! * pk) : '?')))]
    if (kgs.length === 1 && kgs[0] !== '?')
      return kgs[0] + 'kg × ' + f.map((s) => (s.r != null ? s.r : '·')).join(', ')
    return f
      .map(
        (s) =>
          (pv(s) != null ? fmtKg(pv(s)! * pk) + 'kg' : '') +
          (pv(s) != null && s.r != null ? '×' : '') +
          (s.r != null ? s.r : ''),
      )
      .join(', ')
  }
  const f = rs.filter((s) => s.w != null || s.r != null)
  if (!f.length) return ''
  const ws = [...new Set(f.map((s) => (s.w != null ? s.w : '?')))]
  if (ws.length === 1 && ws[0] !== '?')
    return f[0].w + 'kg × ' + f.map((s) => (s.r != null ? s.r : '·')).join(', ')
  return f
    .map(
      (s) =>
        (s.w != null ? s.w + 'kg' : '') +
        (s.w != null && s.r != null ? '×' : '') +
        (s.r != null ? s.r : ''),
    )
    .join(', ')
}

export function colorFor(session: { type?: string; name?: string | null } | null): string | null {
  if (!session) return null
  if (session.type === 'rest') return 'var(--rest)'
  if (session.type === 'cardio') return 'var(--cardio)'
  const n = norm(session.name || '')
  if (/leg|squat|quad|ham|glute|calf|calves/.test(n)) return 'var(--leg)'
  if (/push|chest|bench|shoulder|press|tri/.test(n)) return 'var(--push)'
  if (/pull|back|row|lat|bicep|deadlift/.test(n)) return 'var(--pull)'
  if (/arm|curl/.test(n)) return 'var(--arm)'
  return 'var(--other)'
}
