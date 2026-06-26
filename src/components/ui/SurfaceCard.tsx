import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useTapBurst } from '@/components/anime/hooks'

export function SurfaceCard({
  children,
  className,
  active,
  onClick,
  padding = 'default',
}: {
  children: ReactNode
  className?: string
  active?: boolean
  onClick?: () => void
  padding?: 'default' | 'lg' | 'none'
}) {
  const pad = padding === 'lg' ? '!p-5' : padding === 'none' ? '!p-0' : '!p-4'
  const onTap = useTapBurst()
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      onPointerDown={onClick ? onTap : undefined}
      className={cn(
        'surface-card block w-full text-left active:scale-[0.98] transition-transform',
        pad,
        active && 'surface-card-active',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
