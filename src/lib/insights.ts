import type { Meal, NutritionGoal } from '@/lib/food'
import { summariseDay, mealsForDate } from '@/lib/food'
import type { Session } from '@/lib/types'
import {
  computeWeekComparison,
  computeDailyProgress,
  countTrainedDaysInWeek,
  type WeekStats,
} from '@/lib/stats'

export function buildHomeHeadline(
  sessions: Record<string, Session>,
  mealsByDate: Record<string, Meal[]>,
  goals: NutritionGoal,
  todayKey: string,
  week: WeekStats,
  displayName?: string | null,
): string {
  const comparison = computeWeekComparison(sessions)
  const progress = computeDailyProgress(sessions, mealsByDate, goals, todayKey)
  const macros = summariseDay(mealsForDate(mealsByDate, todayKey))
  const name = displayName?.split(' ')[0]

  if (progress.trainedToday && macros.protein_g >= goals.protein_g * 0.9) {
    return name ? `${name}, crushing it today` : 'Crushing it today'
  }

  if (!progress.trainedToday && !progress.restToday) {
    const proteinGap = Math.max(0, Math.round(goals.protein_g - macros.protein_g))
    if (proteinGap > 15 && macros.kcal < goals.kcal * 0.5) {
      return `${proteinGap}g protein to hit goal`
    }
    return name ? `${name}, ready to train?` : 'Ready to train?'
  }

  if (comparison.deltaSessions > 0) {
    return `${week.sessions} sessions this week — up ${comparison.deltaSessions}`
  }
  if (comparison.deltaSessions < 0) {
    return `${week.sessions} sessions — ${Math.abs(comparison.deltaSessions)} fewer than last week`
  }

  const trainedDays = countTrainedDaysInWeek(week, sessions)
  return `${trainedDays}/7 days trained this week`
}

export function buildHomeSubline(
  sessions: Record<string, Session>,
  streak: number,
  week: WeekStats,
): string {
  const trainedDays = countTrainedDaysInWeek(week, sessions)
  const parts: string[] = []
  if (streak > 0) parts.push(`${streak}-day streak`)
  parts.push(`${trainedDays}/7 trained`)
  if (week.volumeKg > 0) parts.push(`${week.volumeKg.toLocaleString()} kg volume`)
  return parts.join(' · ')
}

export function buildTodaySummary(
  sessions: Record<string, Session>,
  mealsByDate: Record<string, Meal[]>,
  goals: NutritionGoal,
  todayKey: string,
): string {
  const s = sessions[todayKey]
  const macros = summariseDay(mealsForDate(mealsByDate, todayKey))
  const parts: string[] = []

  if (s?.kind === 'workout' || s?.kind === 'cardio') {
    parts.push(s.name ? `${s.name} logged` : 'Workout logged')
  } else if (s?.kind === 'rest') {
    parts.push('Rest day')
  } else {
    parts.push('No workout yet')
  }

  parts.push(`${Math.round(macros.protein_g)}/${goals.protein_g}g protein`)
  parts.push(`${Math.round(macros.kcal)} kcal`)

  return parts.join(' · ')
}
