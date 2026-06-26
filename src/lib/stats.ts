import { resolve } from '@/lib/sets'
import { key } from '@/lib/utils'
import type { Session } from '@/lib/types'
import type { Meal, NutritionGoal } from '@/lib/food'
import { mealsForDate, summariseDay } from '@/lib/food'

export interface WeekStats {
  sessions: number
  sets: number
  volumeKg: number
  days: string[]
}

function isTrainingSession(s: Session | undefined): boolean {
  return !!s && (s.kind === 'workout' || s.kind === 'cardio')
}

export function sessionDayVolume(s: Session): number {
  if (s.kind === 'rest') return 0
  let volumeKg = 0
  let sets = 0
  for (const ex of s.exercises || []) {
    for (const set of ex.sets) {
      const r = resolve(set)
      if (r.r != null && (r.w != null || r.p != null)) {
        sets++
        const w = r.w ?? (r.p != null ? r.p * 2.27 : 0)
        volumeKg += w * r.r
      } else if (r.r != null) {
        sets++
      }
    }
  }
  void sets
  return Math.round(volumeKg)
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
    const k = key(d)
    days.push(k)
    const s = sessions[k]
    if (!s || s.kind === 'rest') continue
    if (s.kind === 'workout' || s.kind === 'cardio') sessionCount++
    volumeKg += sessionDayVolume(s)
    for (const ex of s.exercises || []) {
      ex.sets.forEach((set) => {
        const r = resolve(set)
        if (r.r != null && (r.w != null || r.p != null)) sets++
        else if (r.r != null) sets++
      })
    }
  }

  return {
    sessions: sessionCount,
    sets,
    volumeKg: Math.round(volumeKg),
    days,
  }
}

/** @deprecated prefer computeActiveStreak */
export function computeStreak(sessions: Record<string, Session>): number {
  return computeActiveStreak(sessions)
}

export function computeActiveStreak(
  sessions: Record<string, Session>,
  refDate = new Date(),
): number {
  const todayK = key(refDate)
  const today = sessions[todayK]
  let d = new Date(refDate)

  if (!isTrainingSession(today)) {
    if (today?.kind !== 'rest') {
      d.setDate(d.getDate() - 1)
    } else {
      d.setDate(d.getDate() - 1)
    }
  }

  let count = 0
  for (let i = 0; i < 365; i++) {
    const k = key(d)
    const s = sessions[k]
    if (isTrainingSession(s)) {
      count++
      d.setDate(d.getDate() - 1)
      continue
    }
    if (s?.kind === 'rest') {
      d.setDate(d.getDate() - 1)
      continue
    }
    break
  }
  return count
}

export function computeVolumeBaseline(
  sessions: Record<string, Session>,
  weeks = 4,
  refDate = new Date(),
): number {
  const weeklyVolumes: number[] = []
  for (let w = 0; w < weeks; w++) {
    const end = new Date(refDate)
    end.setDate(end.getDate() - w * 7)
    const vol = computeWeekStats(sessions, end).volumeKg
    if (vol > 0) weeklyVolumes.push(vol)
  }
  if (!weeklyVolumes.length) return 3000
  return Math.round(weeklyVolumes.reduce((a, b) => a + b, 0) / weeklyVolumes.length)
}

export interface WeekComparison {
  current: WeekStats
  prior: WeekStats
  deltaSessions: number
  deltaSets: number
  deltaVolumePct: number | null
}

export function computeWeekComparison(
  sessions: Record<string, Session>,
  refDate = new Date(),
): WeekComparison {
  const current = computeWeekStats(sessions, refDate)
  const priorEnd = new Date(refDate)
  priorEnd.setDate(priorEnd.getDate() - 7)
  const prior = computeWeekStats(sessions, priorEnd)
  const deltaVolumePct =
    prior.volumeKg > 0
      ? Math.round(((current.volumeKg - prior.volumeKg) / prior.volumeKg) * 100)
      : null
  return {
    current,
    prior,
    deltaSessions: current.sessions - prior.sessions,
    deltaSets: current.sets - prior.sets,
    deltaVolumePct,
  }
}

export interface DailyProgress {
  score: number
  breakdown: { workout: number; protein: number; calories: number }
  trainedToday: boolean
  restToday: boolean
}

export function computeDailyProgress(
  sessions: Record<string, Session>,
  mealsByDate: Record<string, Meal[]>,
  goals: NutritionGoal,
  todayKey: string,
): DailyProgress {
  const s = sessions[todayKey]
  const trainedToday = isTrainingSession(s)
  const restToday = s?.kind === 'rest'

  const workoutPts = trainedToday || restToday ? 33 : 0
  const macros = summariseDay(mealsForDate(mealsByDate, todayKey))
  const proteinPts =
    goals.protein_g > 0
      ? Math.round(Math.min(1, macros.protein_g / goals.protein_g) * 33)
      : 0

  let caloriePts = 0
  if (goals.kcal > 0) {
    const ratio = macros.kcal / goals.kcal
    if (ratio >= 0.85 && ratio <= 1.15) caloriePts = 34
    else if (ratio >= 0.7 && ratio <= 1.3) caloriePts = 20
    else if (macros.kcal > 0) caloriePts = 10
  }

  const score = Math.min(100, workoutPts + proteinPts + caloriePts)
  return {
    score,
    breakdown: { workout: workoutPts, protein: proteinPts, calories: caloriePts },
    trainedToday,
    restToday,
  }
}

export function formatDeltaSessions(n: number): string | undefined {
  if (n === 0) return 'same as last week'
  return n > 0 ? `+${n} vs last week` : `${n} vs last week`
}

export function formatDeltaVolume(pct: number | null): string | undefined {
  if (pct == null) return undefined
  if (pct === 0) return 'flat vs last week'
  return pct > 0 ? `+${pct}% volume` : `${pct}% volume`
}

export function countTrainedDaysInWeek(week: WeekStats, sessions: Record<string, Session>): number {
  return week.days.filter((k) => isTrainingSession(sessions[k])).length
}
