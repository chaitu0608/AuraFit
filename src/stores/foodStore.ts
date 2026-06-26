import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Meal, MealSlot, NutritionGoal, ParsedFoodItem } from '@/lib/food'
import { DEFAULT_NUTRITION_GOAL } from '@/lib/food'
import { todayKey } from '@/lib/utils'

export interface RecentFood {
  food_id: string | null
  name: string
  qty: number
  unit: string
  grams: number
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  lastUsed: string
}

interface FoodQueueItem {
  id: string
  type: 'meal' | 'food_log'
  action: 'upsert' | 'delete'
  payload: unknown
  createdAt: string
}

interface FoodState {
  mealsByDate: Record<string, Meal[]>
  goals: NutritionGoal
  recentFoods: RecentFood[]
  pendingItems: ParsedFoodItem[]
  queue: FoodQueueItem[]
  setMealsForDate: (dateKey: string, meals: Meal[]) => void
  upsertMeal: (dateKey: string, meal: Meal) => void
  addLogToMeal: (dateKey: string, mealId: string, log: Meal['logs'][0]) => void
  removeLog: (dateKey: string, mealId: string, logId: string) => void
  setGoals: (goals: NutritionGoal) => void
  setPendingItems: (items: ParsedFoodItem[]) => void
  updatePendingItem: (index: number, item: ParsedFoodItem) => void
  removePendingItem: (index: number) => void
  clearPending: () => void
  addRecentFood: (item: Omit<RecentFood, 'lastUsed'>) => void
  enqueue: (item: Omit<FoodQueueItem, 'id' | 'createdAt'>) => void
  dequeue: (id: string) => void
}

function upsertMealInList(meals: Meal[], meal: Meal): Meal[] {
  const idx = meals.findIndex((m) => m.id === meal.id)
  if (idx >= 0) {
    const next = [...meals]
    next[idx] = meal
    return next
  }
  return [...meals, meal]
}

export const useFoodStore = create<FoodState>()(
  persist(
    (set, get) => ({
      mealsByDate: {},
      goals: DEFAULT_NUTRITION_GOAL,
      recentFoods: [],
      pendingItems: [],
      queue: [],

      setMealsForDate: (dateKey, meals) =>
        set({ mealsByDate: { ...get().mealsByDate, [dateKey]: meals } }),

      upsertMeal: (dateKey, meal) => {
        const existing = get().mealsByDate[dateKey] ?? []
        set({
          mealsByDate: {
            ...get().mealsByDate,
            [dateKey]: upsertMealInList(existing, meal),
          },
        })
      },

      addLogToMeal: (dateKey, mealId, log) => {
        const meals = get().mealsByDate[dateKey] ?? []
        const meal = meals.find((m) => m.id === mealId)
        if (!meal) return
        const updated: Meal = {
          ...meal,
          logs: [...meal.logs.filter((l) => l.id !== log.id), log],
        }
        get().upsertMeal(dateKey, updated)
      },

      removeLog: (dateKey, mealId, logId) => {
        const meals = get().mealsByDate[dateKey] ?? []
        const meal = meals.find((m) => m.id === mealId)
        if (!meal) return
        get().upsertMeal(dateKey, { ...meal, logs: meal.logs.filter((l) => l.id !== logId) })
      },

      setGoals: (goals) => set({ goals }),

      setPendingItems: (items) => set({ pendingItems: items }),

      updatePendingItem: (index, item) => {
        const next = [...get().pendingItems]
        next[index] = item
        set({ pendingItems: next })
      },

      removePendingItem: (index) => {
        set({ pendingItems: get().pendingItems.filter((_, i) => i !== index) })
      },

      clearPending: () => set({ pendingItems: [] }),

      addRecentFood: (item) => {
        const entry: RecentFood = { ...item, lastUsed: new Date().toISOString() }
        const filtered = get().recentFoods.filter(
          (r) => !(r.name === item.name && r.qty === item.qty && r.unit === item.unit),
        )
        set({ recentFoods: [entry, ...filtered].slice(0, 20) })
      },

      enqueue: (item) =>
        set({
          queue: [
            ...get().queue,
            { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ],
        }),

      dequeue: (id) => set({ queue: get().queue.filter((q) => q.id !== id) }),
    }),
    { name: 'aurafit-food' },
  ),
)

export function getOrCreateMeal(
  meals: Meal[],
  dateKey: string,
  slot: MealSlot,
  userId?: string,
): Meal {
  const existing = meals.find((m) => m.slot === slot)
  if (existing) return existing
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    date: dateKey,
    slot,
    logs: [],
  }
}

export function todayMeals(state: FoodState): Meal[] {
  return state.mealsByDate[todayKey] ?? []
}
