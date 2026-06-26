import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { MealSlot, ParsedFoodItem } from '@/lib/food'

export interface ParseFoodResult {
  items: ParsedFoodItem[]
  meal_slot: MealSlot
}

export async function parseFoodText(
  text: string,
  mealSlot: MealSlot,
  locale = 'en-IN',
): Promise<ParseFoodResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_ANON_KEY to .env')
  }

  const { data, error } = await supabase.functions.invoke<ParseFoodResult>('parse-food', {
    body: { text, meal_slot: mealSlot, locale },
  })

  if (error) throw new Error(error.message || 'Failed to parse food')
  if (!data?.items?.length) throw new Error('No food items detected')

  return data
}
