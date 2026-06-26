import { useEffect, useRef } from 'react'
import anime from 'animejs'
import { useAnimatedNumber } from '@/components/anime/hooks'
import { Flame } from 'lucide-react'

export function ScoreboardHero({
  score,
  headline,
  subline,
  streak,
}: {
  score: number
  headline: string
  subline: string
  streak: number
}) {
  const scoreRef = useAnimatedNumber(score, 700)
  const ringRef = useRef<SVGCircleElement>(null)
  const size = 88
  const r = 36
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 100)

  useEffect(() => {
    if (!ringRef.current) return
    anime({
      targets: ringRef.current,
      strokeDashoffset: [circumference, offset],
      duration: 900,
      easing: 'easeOutCubic',
    })
  }, [circumference, offset, score])

  return (
    <div className="scoreboard-band -mx-5 px-5 py-5 mb-5">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={6} />
            <circle
              ref={ringRef}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </svg>
          <div
            ref={scoreRef}
            className="absolute inset-0 flex items-center justify-center num font-display text-[22px] font-extrabold text-text"
          >
            {score}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">
            Today&apos;s progress
          </p>
          <h1 className="font-display text-[22px] font-extrabold tracking-tight leading-tight">
            {headline}
          </h1>
          <p className="text-[12px] text-muted mt-1.5 flex items-center gap-1.5 flex-wrap">
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 text-accent font-semibold">
                <Flame size={13} />
                {streak}
              </span>
            )}
            <span>{subline}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
