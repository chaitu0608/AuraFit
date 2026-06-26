import { type ReactNode } from 'react'
import { useAnimatedNumber } from '@/components/anime/hooks'
import { cn } from '@/lib/utils'

export function MetricHero({
  label,
  value,
  unit,
  delta,
  icon,
  className,
}: {
  label: string
  value: number
  unit?: string
  delta?: string
  icon?: ReactNode
  className?: string
}) {
  const numRef = useAnimatedNumber(value)

  return (
    <div className={cn('metric-hero', className)}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span ref={numRef} className="num font-display text-[36px] font-extrabold tracking-tight leading-none text-text">
          {value}
        </span>
        {unit && <span className="text-[14px] font-semibold text-muted">{unit}</span>}
      </div>
      {delta && <p className="text-[12px] text-accent font-medium mt-1">{delta}</p>}
    </div>
  )
}
