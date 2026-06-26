import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({
  children,
  className,
  interactive,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div className={cn(interactive ? 'card-pro-interactive' : 'card-pro', 'p-4 mb-3', className)}>
      {children}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block mb-4', className)}>
      <span className="block text-[13px] font-medium text-muted mb-2">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-faint mt-1.5">{hint}</span>}
    </label>
  )
}

export function Empty({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-[16px] font-semibold text-text mb-1.5">{title}</div>
      {subtitle && <div className="text-sm text-muted mb-4">{subtitle}</div>}
      {action}
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-end justify-between mb-3 px-0.5', className)}>
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
