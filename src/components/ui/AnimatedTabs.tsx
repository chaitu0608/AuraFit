import { cn } from '@/lib/utils'
import { hapticLight } from '@/lib/haptics'
import { useSlidingPill, useTapBurst } from '@/components/anime/hooks'

export function AnimatedTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const { containerRef, pillRef } = useSlidingPill(activeIndex)
  const onTap = useTapBurst()

  return (
    <div ref={containerRef} className={cn('animated-tabs relative', className)}>
      <span
        ref={pillRef}
        className="absolute top-1 bottom-1 left-0 rounded-full bg-accent shadow-glow-sm pointer-events-none"
        style={{ width: 0, transform: 'translateX(0)' }}
        aria-hidden
      />
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            data-tab
            onPointerDown={onTap}
            onClick={() => {
              void hapticLight()
              onChange(opt.value)
            }}
            className={cn('animated-tab relative z-10', active ? 'text-accent-ink' : 'text-muted')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
