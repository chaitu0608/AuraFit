import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-rs bg-surface2 animate-pulse bg-gradient-to-r from-surface2 via-surface3 to-surface2 bg-[length:200%_100%]',
        className,
      )}
    />
  )
}

export function FoodParseSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
