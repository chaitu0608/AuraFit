import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Empty, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FoodInput } from '@/features/food/FoodInput'
import { FoodItemCard } from '@/features/food/FoodItemCard'
import { MealSlotChips } from '@/features/food/MealSlotChips'
import { RecentFoodsList } from '@/features/food/RecentFoodsList'
import { MacroRings } from '@/features/food/MacroRings'
import { DayMacroSummaryBar } from '@/features/food/DayMacroSummary'
import { useFoodStore, getOrCreateMeal } from '@/stores/foodStore'
import { useAuthStore } from '@/stores/authStore'
import { parseFoodText } from '@/lib/parseFood'
import {
  currentMealSlot,
  mealsForDate,
  slotLabel,
  summariseDay,
  type FoodLog,
  type MealSlot,
  type ParsedFoodItem,
} from '@/lib/food'
import { key, pretty, todayKey, fromKey } from '@/lib/utils'
import type { RecentFood } from '@/stores/foodStore'

export function FoodPage() {
  const navigate = useNavigate()
  const { dateKey: paramDate } = useParams()
  const dateKey = paramDate ?? todayKey
  const profile = useAuthStore((s) => s.profile)

  const mealsByDate = useFoodStore((s) => s.mealsByDate)
  const goals = useFoodStore((s) => s.goals)
  const pendingItems = useFoodStore((s) => s.pendingItems)
  const recentFoods = useFoodStore((s) => s.recentFoods)
  const setPendingItems = useFoodStore((s) => s.setPendingItems)
  const updatePendingItem = useFoodStore((s) => s.updatePendingItem)
  const removePendingItem = useFoodStore((s) => s.removePendingItem)
  const clearPending = useFoodStore((s) => s.clearPending)
  const upsertMeal = useFoodStore((s) => s.upsertMeal)
  const addRecentFood = useFoodStore((s) => s.addRecentFood)
  const enqueue = useFoodStore((s) => s.enqueue)

  const [slot, setSlot] = useState<MealSlot>(currentMealSlot())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meals = mealsForDate(mealsByDate, dateKey)
  const eaten = summariseDay(meals)

  const shiftDate = (delta: number) => {
    const d = fromKey(dateKey)
    d.setDate(d.getDate() + delta)
    navigate(`/food/${key(d)}`)
  }

  const handleParse = async (text: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await parseFoodText(text, slot)
      setPendingItems(result.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse food')
    } finally {
      setLoading(false)
    }
  }

  const confirmPending = () => {
    if (!pendingItems.length) return
    const meal = getOrCreateMeal(meals, dateKey, slot, profile?.id)
    const newLogs: FoodLog[] = pendingItems.map((item) => itemToLog(item, meal.id))
    const updatedMeal = { ...meal, logs: [...meal.logs, ...newLogs] }
    upsertMeal(dateKey, updatedMeal)
    enqueue({ type: 'meal', action: 'upsert', payload: updatedMeal })
    for (const item of pendingItems) {
      addRecentFood({
        food_id: item.food_id,
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        grams: item.grams,
        kcal: item.kcal,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
      })
    }
    clearPending()
  }

  const handleRecentSelect = (item: RecentFood) => {
    const parsed: ParsedFoodItem = {
      food_id: item.food_id,
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      grams: item.grams,
      kcal: item.kcal,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      confidence: 0.9,
    }
    setPendingItems([...pendingItems, parsed])
  }

  return (
    <AppShell title="Food" subtitle={pretty(dateKey)} fab={false}>
      <div className="flex items-center justify-between mb-4">
        <button type="button" className="icon-btn" onClick={() => shiftDate(-1)} aria-label="Previous day">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-muted">{dateKey === todayKey ? 'Today' : pretty(dateKey)}</span>
        <button type="button" className="icon-btn" onClick={() => shiftDate(1)} aria-label="Next day">
          <ChevronRight size={18} />
        </button>
      </div>

      <Card className="!p-4 mb-4 flex flex-col items-center">
        <MacroRings eaten={eaten} goals={goals} />
        <div className="w-full mt-4">
          <DayMacroSummaryBar eaten={eaten} goals={goals} />
        </div>
      </Card>

      <SectionHeader title="Log meal" subtitle="Type or speak what you ate" />
      <MealSlotChips value={slot} onChange={setSlot} />
      <div className="mt-3">
        <FoodInput slot={slot} onParse={handleParse} loading={loading} />
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-rs bg-danger/10 border border-danger/30 text-[13px] text-danger">
          {error}
        </div>
      )}

      {pendingItems.length > 0 && (
        <div className="mt-5">
          <SectionHeader
            title="Review"
            subtitle={`${pendingItems.length} item${pendingItems.length > 1 ? 's' : ''} detected`}
            action={
              <Button variant="primary" size="sm" onClick={confirmPending}>
                Confirm
              </Button>
            }
          />
          {pendingItems.map((item, i) => (
            <FoodItemCard
              key={`pending-${i}`}
              item={item}
              onChange={(updated) => updatePendingItem(i, updated)}
              onRemove={() => removePendingItem(i)}
            />
          ))}
        </div>
      )}

      {meals.length > 0 ? (
        <div className="mt-6">
          <SectionHeader title="Logged today" />
          {meals.map((meal) => (
            <div key={meal.id} className="mb-4">
              <div className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2">
                {slotLabel(meal.slot)}
              </div>
              {meal.logs.map((log) => (
                <Card key={log.id} className="!p-3 !mb-2">
                  <div className="font-medium text-[14px]">{log.name || log.raw_text}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {log.qty} {log.unit} · {log.kcal ?? 0} kcal · {log.protein_g ?? 0}P · {log.carbs_g ?? 0}C · {log.fat_g ?? 0}F
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </div>
      ) : (
        !pendingItems.length && (
          <Empty
            title="No meals logged"
            subtitle="Describe what you ate and we'll parse calories and macros."
          />
        )
      )}

      <RecentFoodsList items={recentFoods} onSelect={handleRecentSelect} />
    </AppShell>
  )
}

function itemToLog(item: ParsedFoodItem, mealId: string): FoodLog {
  return {
    id: crypto.randomUUID(),
    meal_id: mealId,
    food_id: item.food_id,
    raw_text: item.name,
    name: item.name,
    qty: item.qty,
    unit: item.unit,
    grams: item.grams,
    kcal: item.kcal,
    protein_g: item.protein_g,
    carbs_g: item.carbs_g,
    fat_g: item.fat_g,
    ai_confidence: item.confidence,
  }
}
