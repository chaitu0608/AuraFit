import { cn } from '@/lib/utils'
import type { MealSlot } from '@/lib/food'
import { MEAL_SLOTS } from '@/lib/food'

export function MealSlotChips({
  value,
  onChange,
}: {
  value: MealSlot
  onChange: (slot: MealSlot) => void
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
      {MEAL_SLOTS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'pill shrink-0 text-[12px] font-semibold transition-colors',
            value === id
              ? 'bg-accent text-accent-ink border border-accent/40'
              : 'bg-surface2 text-muted border border-line',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
