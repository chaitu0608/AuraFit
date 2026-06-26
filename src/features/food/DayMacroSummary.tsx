import type { DayMacroSummary, NutritionGoal } from '@/lib/food'

export function DayMacroSummaryBar({
  eaten,
  goals,
}: {
  eaten: DayMacroSummary
  goals: NutritionGoal
}) {
  const rows = [
    { label: 'Calories', value: eaten.kcal, goal: goals.kcal, unit: 'kcal' },
    { label: 'Protein', value: eaten.protein_g, goal: goals.protein_g, unit: 'g' },
    { label: 'Carbs', value: eaten.carbs_g, goal: goals.carbs_g, unit: 'g' },
    { label: 'Fat', value: eaten.fat_g, goal: goals.fat_g, unit: 'g' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map((row) => {
        const pct = row.goal > 0 ? Math.min(100, Math.round((row.value / row.goal) * 100)) : 0
        return (
          <div key={row.label} className="p-3 rounded-rs bg-surface2 border border-line">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-faint mb-1">
              {row.label}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="num text-[18px] font-bold">{Math.round(row.value)}</span>
              <span className="text-[11px] text-muted">/ {row.goal}{row.unit === 'kcal' ? '' : row.unit}</span>
            </div>
            <div className="mt-2 h-1 rounded-full bg-line overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
