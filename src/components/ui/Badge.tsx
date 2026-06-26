import { cn } from '@/lib/utils'

const tones = {
  default: 'bg-surface2 text-muted border-line',
  accent: 'bg-accent-dim text-accent border-accent/30',
  push: 'bg-push/15 text-push border-push/25',
  pull: 'bg-pull/15 text-pull border-pull/25',
  leg: 'bg-leg/15 text-leg border-leg/25',
  ok: 'bg-ok/15 text-ok border-ok/25',
  warn: 'bg-warn/15 text-warn border-warn/25',
  cardio: 'bg-cardio/15 text-cardio border-cardio/25',
} as const

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode
  tone?: keyof typeof tones
  className?: string
}) {
  return (
    <span className={cn('pill border', tones[tone], className)}>{children}</span>
  )
}
