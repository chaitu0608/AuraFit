import { useDataStore } from '@/stores/dataStore'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { computeWeekStats } from '@/lib/stats'
import { useFadeIn } from '@/components/anime/hooks'

export function WeeklyRecapCard() {
  const sessions = useDataStore((s) => s.sessions)
  const week = computeWeekStats(sessions)
  const ref = useFadeIn<HTMLDivElement>([week.sessions])

  if (week.sessions === 0) return null

  return (
    <div ref={ref}>
      <Card className="!p-4 mb-4 border-accent/20 bg-gradient-to-br from-accent-dim to-transparent">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Weekly recap</p>
        <p className="text-[15px] font-medium mb-3">
          {week.sessions} workout{week.sessions !== 1 ? 's' : ''} · {week.sets} sets · {week.volumeKg} kg volume
        </p>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Sessions" value={week.sessions} />
          <StatCard label="Sets" value={week.sets} />
          <StatCard label="Volume" value={week.volumeKg} unit="kg" />
        </div>
      </Card>
    </div>
  )
}
