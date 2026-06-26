import { resolve } from '@/lib/sets'
import type { Session } from '@/lib/types'

export interface WeekStats {
  sessions: number
  sets: number
  volumeKg: number
  days: string[]
}

export function computeWeekStats(
  sessions: Record<string, Session>,
  refDate = new Date(),
): WeekStats {
  const start = new Date(refDate)
  start.setDate(start.getDate() - 6)
  const days: string[] = []
  let sessionCount = 0
  let sets = 0
  let volumeKg = 0

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const k =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    days.push(k)
    const s = sessions[k]
    if (!s || s.kind === 'rest') continue
    if (s.kind === 'workout' || s.kind === 'cardio') sessionCount++
    ;(s.exercises || []).forEach((ex) => {
      ex.sets.forEach((set) => {
        const r = resolve(set)
        if (r.r != null && (r.w != null || r.p != null)) {
          sets++
          const w = r.w ?? (r.p != null ? r.p * 2.27 : 0)
          volumeKg += w * r.r
        } else if (r.r != null) {
          sets++
        }
      })
    })
  }

  return {
    sessions: sessionCount,
    sets,
    volumeKg: Math.round(volumeKg),
    days,
  }
}

export function computeStreak(sessions: Record<string, Session>): number {
  const keys = Object.keys(sessions)
    .filter((k) => sessions[k]?.kind !== 'rest')
    .sort()
    .reverse()
  let count = 0
  let prev: Date | null = null
  for (const k of keys) {
    const d = new Date(k)
    if (!prev) {
      count = 1
      prev = d
      continue
    }
    const diff = (prev.getTime() - d.getTime()) / 86400000
    if (diff === 1) {
      count++
      prev = d
    } else break
  }
  return count
}
