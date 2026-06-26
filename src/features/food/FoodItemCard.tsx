import { Trash2 } from 'lucide-react'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { ParsedFoodItem } from '@/lib/food'
import { useEnter } from '@/components/anime/hooks'

export function FoodItemCard({
  item,
  onChange,
  onRemove,
}: {
  item: ParsedFoodItem
  onChange: (item: ParsedFoodItem) => void
  onRemove: () => void
}) {
  const lowConfidence = item.confidence < 0.6
  const enterRef = useEnter<HTMLDivElement>([item.name, item.qty])

  return (
    <div ref={enterRef} className="mb-2">
    <SurfaceCard className="!p-3" active={lowConfidence}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[14px] truncate">{item.name}</div>
          <div className="text-[11px] text-muted mt-0.5">
            {item.kcal} kcal · {item.protein_g}P · {item.carbs_g}C · {item.fat_g}F
          </div>
        </div>
        <button type="button" className="icon-btn !w-8 !h-8 text-danger" onClick={onRemove} aria-label="Remove">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          min={0}
          step={0.5}
          value={item.qty}
          className="!w-16 text-center num"
          onChange={(e) => onChange({ ...item, qty: parseFloat(e.target.value) || 0 })}
        />
        <Input
          value={item.unit}
          className="flex-1"
          onChange={(e) => onChange({ ...item, unit: e.target.value })}
        />
        <Input
          type="number"
          min={0}
          value={item.grams}
          className="!w-20 text-center num"
          onChange={(e) => onChange({ ...item, grams: parseFloat(e.target.value) || 0 })}
        />
        <span className="text-[11px] text-faint shrink-0">g</span>
      </div>
      {lowConfidence && (
        <Badge tone="warn" className="mt-2">
          AI estimate — tap to edit
        </Badge>
      )}
    </SurfaceCard>
    </div>
  )
}
