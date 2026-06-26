export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type FoodSource = 'usda' | 'off' | 'custom' | 'ai'

export interface Food {
  id: string
  source: FoodSource
  source_id?: string | null
  name: string
  brand?: string | null
  serving_qty?: number | null
  serving_unit?: string | null
  serving_grams?: number | null
  kcal?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
}

export interface FoodLog {
  id: string
  meal_id: string
  food_id?: string | null
  raw_text?: string | null
  name?: string
  qty: number
  unit: string
  grams?: number | null
  kcal?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  ai_confidence?: number | null
  created_at?: string
}

export interface Meal {
  id: string
  user_id?: string
  date: string
  slot: MealSlot
  notes?: string | null
  logs: FoodLog[]
  created_at?: string
}

export interface NutritionGoal {
  user_id?: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface ParsedFoodItem {
  food_id: string | null
  name: string
  qty: number
  unit: string
  grams: number
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  confidence: number
}

export interface DayMacroSummary {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export const MEAL_SLOTS: { id: MealSlot; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
]

export const DEFAULT_NUTRITION_GOAL: NutritionGoal = {
  kcal: 2200,
  protein_g: 150,
  carbs_g: 220,
  fat_g: 70,
}

const UNIT_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  piece: 50,
  pieces: 50,
  roti: 40,
  rotis: 40,
  bowl: 300,
  serving: 100,
}

export function gramsFor(qty: number, unit: string, food?: Pick<Food, 'serving_grams' | 'serving_qty'>): number {
  const key = unit.toLowerCase().trim()
  if (key === 'g' || key === 'gram' || key === 'grams') return qty
  if (food?.serving_grams && food.serving_qty) {
    return Math.round((qty / food.serving_qty) * food.serving_grams)
  }
  const perUnit = UNIT_GRAMS[key]
  if (perUnit) return Math.round(qty * perUnit)
  return Math.round(qty * 100)
}

export function scaleMacrosFromFood(
  food: Pick<Food, 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'serving_grams'>,
  grams: number,
): DayMacroSummary {
  const base = food.serving_grams || 100
  const factor = grams / base
  return {
    kcal: Math.round((food.kcal ?? 0) * factor),
    protein_g: Math.round((food.protein_g ?? 0) * factor * 10) / 10,
    carbs_g: Math.round((food.carbs_g ?? 0) * factor * 10) / 10,
    fat_g: Math.round((food.fat_g ?? 0) * factor * 10) / 10,
  }
}

export function summariseDay(meals: Meal[]): DayMacroSummary {
  return meals.reduce(
    (acc, meal) => {
      for (const log of meal.logs) {
        acc.kcal += log.kcal ?? 0
        acc.protein_g += log.protein_g ?? 0
        acc.carbs_g += log.carbs_g ?? 0
        acc.fat_g += log.fat_g ?? 0
      }
      return acc
    },
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )
}

export function mealsForDate(mealsByDate: Record<string, Meal[]>, dateKey: string): Meal[] {
  return mealsByDate[dateKey] ?? []
}

export function slotLabel(slot: MealSlot): string {
  return MEAL_SLOTS.find((s) => s.id === slot)?.label ?? slot
}

export function currentMealSlot(): MealSlot {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 20) return 'dinner'
  return 'snack'
}
