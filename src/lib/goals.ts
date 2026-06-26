import type { NutritionGoal } from '@/lib/food'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { LB } from '@/lib/utils'

export type TrainingGoal = 'cut' | 'maintain' | 'bulk'

export const TRAINING_GOALS: { id: TrainingGoal; label: string }[] = [
  { id: 'cut', label: 'Cut' },
  { id: 'maintain', label: 'Maintain' },
  { id: 'bulk', label: 'Bulk' },
]

export function displayWeightToKg(weight: number, units: 'kg' | 'lb'): number {
  return units === 'lb' ? weight * LB : weight
}

export function kgToDisplayWeight(kg: number, units: 'kg' | 'lb'): number {
  return units === 'lb' ? Math.round(kg / LB) : Math.round(kg * 10) / 10
}

export function macrosFromBody(weightKg: number, goal: TrainingGoal): NutritionGoal {
  const protein_g = Math.round(weightKg * (goal === 'cut' ? 2.2 : goal === 'bulk' ? 2.0 : 1.8))
  const fat_g = Math.round(weightKg * 0.8)
  const tdee = Math.round(weightKg * 33)
  const kcal = goal === 'cut' ? tdee - 400 : goal === 'bulk' ? tdee + 300 : tdee
  const carbs_g = Math.max(80, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4))
  return { kcal, protein_g, carbs_g, fat_g }
}

export async function persistNutritionGoals(
  userId: string,
  goals: NutritionGoal,
): Promise<void> {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('nutrition_goals').upsert({
    user_id: userId,
    kcal: goals.kcal,
    protein_g: goals.protein_g,
    carbs_g: goals.carbs_g,
    fat_g: goals.fat_g,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function persistProfileGoals(
  userId: string,
  bodyWeightKg: number,
  trainingGoal: TrainingGoal,
  goals: NutritionGoal,
): Promise<void> {
  if (!isSupabaseConfigured) return
  const { error: pErr } = await supabase.from('profiles').update({
    body_weight_kg: bodyWeightKg,
    training_goal: trainingGoal,
  }).eq('id', userId)
  if (pErr) throw pErr
  await persistNutritionGoals(userId, goals)
}
