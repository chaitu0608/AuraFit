import { useEffect, useRef } from 'react'
import anime from 'animejs'
import type { DayMacroSummary, NutritionGoal } from '@/lib/food'

interface RingProps {
  cx: number
  cy: number
  r: number
  stroke: string
  value: number
  max: number
  strokeWidth?: number
}

function Ring({ cx, cy, r, stroke, value, max, strokeWidth = 8 }: RingProps) {
  const ref = useRef<SVGCircleElement>(null)
  const circumference = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, value / max) : 0
  const offset = circumference * (1 - pct)

  useEffect(() => {
    if (!ref.current) return
    anime({
      targets: ref.current,
      strokeDashoffset: [circumference, offset],
      duration: 900,
      easing: 'easeOutCubic',
    })
  }, [circumference, offset, value, max])

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--line)"
        strokeWidth={strokeWidth}
      />
      <circle
        ref={ref}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </>
  )
}

export function MacroRings({
  eaten,
  goals,
  volumeKg = 0,
  volumeGoal = 5000,
  compact,
}: {
  eaten: DayMacroSummary
  goals: NutritionGoal
  volumeKg?: number
  volumeGoal?: number
  compact?: boolean
}) {
  const size = compact ? 120 : 160
  const cx = size / 2
  const cy = size / 2

  return (
    <div className={compact ? 'flex items-center gap-4' : 'flex flex-col items-center'}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <Ring cx={cx} cy={cy} r={compact ? 52 : 68} stroke="var(--accent)" value={eaten.kcal} max={goals.kcal} strokeWidth={compact ? 6 : 8} />
        <Ring cx={cx} cy={cy} r={compact ? 40 : 54} stroke="var(--ok)" value={eaten.protein_g} max={goals.protein_g} strokeWidth={compact ? 5 : 7} />
        <Ring cx={cx} cy={cy} r={compact ? 28 : 40} stroke="var(--pull)" value={volumeKg} max={volumeGoal} strokeWidth={compact ? 4 : 6} />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-text text-[11px] font-semibold">
          {Math.round(eaten.kcal)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted text-[9px]">
          kcal
        </text>
      </svg>
      {!compact && (
        <div className="flex gap-4 mt-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" /> Cal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ok" /> Protein
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pull" /> Volume
          </span>
        </div>
      )}
    </div>
  )
}
