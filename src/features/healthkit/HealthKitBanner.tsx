import { useEffect, useState } from 'react'
import { getWorkoutsForDate, type HealthWorkout } from '@/lib/healthkit'

export function HealthKitBanner({
  dateKey,
  onImport,
}: {
  dateKey: string
  onImport: () => void
}) {
  const [workouts, setWorkouts] = useState<HealthWorkout[]>([])

  useEffect(() => {
    getWorkoutsForDate(dateKey).then(setWorkouts)
  }, [dateKey])

  if (!workouts.length) return null

  return (
    <div className="banner bg-accent/10 border border-accent/35 rounded-r p-3 mb-3.5 text-[13.5px]">
      Apple Watch logged {workouts.length} workout{workouts.length > 1 ? 's' : ''} on this day.
      <button
        type="button"
        className="block mt-2 text-accent font-semibold text-sm"
        onClick={onImport}
      >
        Import & log details →
      </button>
    </div>
  )
}
