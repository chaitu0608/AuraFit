import { Clock } from 'lucide-react'
import { SectionHeader } from '@/components/ui/Card'
import type { RecentFood } from '@/stores/foodStore'

export function RecentFoodsList({
  items,
  onSelect,
}: {
  items: RecentFood[]
  onSelect: (item: RecentFood) => void
}) {
  if (!items.length) return null

  return (
    <div className="mt-6">
      <SectionHeader title="Recent" subtitle="Tap to log again" />
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <button
            key={`${item.name}-${i}`}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 p-3 rounded-rs bg-surface2 border border-line text-left active:scale-[0.99] transition-transform"
          >
            <Clock size={14} className="text-faint shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{item.name}</div>
              <div className="text-[11px] text-muted">
                {item.qty} {item.unit} · {item.kcal} kcal
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
