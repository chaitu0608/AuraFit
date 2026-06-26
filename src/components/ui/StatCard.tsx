import { useAnimatedNumber } from '@/components/anime/hooks'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  unit,
  tone = 'default',
}: {
  label: string
  value: number
  unit?: string
  tone?: 'default' | 'accent'
}) {
  const ref = useAnimatedNumber(value)
  return (
    <div className={cn('stat-tile', tone === 'accent' && 'border-accent/25 bg-accent-dim')}>
      <span className="text-[11px] font-medium text-muted uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        <span ref={ref} className="num text-2xl font-semibold tracking-tight text-text">
          {value}
        </span>
        {unit && <span className="text-xs text-faint">{unit}</span>}
      </div>
    </div>
  )
}
