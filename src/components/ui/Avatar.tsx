import { cn } from '@/lib/utils'

export function Avatar({
  name,
  handle,
  size = 'md',
  className,
}: {
  name?: string | null
  handle?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const letter = (name || handle || '?').charAt(0).toUpperCase()
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-accent-ink shrink-0',
        sizes[size],
        className,
      )}
      style={{
        background: 'linear-gradient(135deg, var(--accent), var(--pull))',
      }}
      aria-hidden
    >
      {letter}
    </div>
  )
}
