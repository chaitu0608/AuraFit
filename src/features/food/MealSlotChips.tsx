import { MEAL_SLOTS, type MealSlot } from '@/lib/food'
import { AnimatedTabs } from '@/components/ui/AnimatedTabs'

export function MealSlotChips({
  value,
  onChange,
}: {
  value: MealSlot
  onChange: (slot: MealSlot) => void
}) {
  return (
    <AnimatedTabs
      options={MEAL_SLOTS.map((s) => ({ value: s.id, label: s.label }))}
      value={value}
      onChange={onChange}
    />
  )
}
