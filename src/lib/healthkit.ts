import { Capacitor } from '@capacitor/core'

export interface HealthWorkout {
  uuid: string
  activityType: string
  startDate: string
  endDate: string
  duration: number
  calories?: number
}

export interface HeartRateSample {
  value: number
  startDate: string
}

let healthKitAvailable = false

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getHealthKit(): Promise<any> {
  const mod = await import('@perfood/capacitor-healthkit')
  return mod.CapacitorHealthkit
}

export async function initHealthKit(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const CapacitorHealthkit = await getHealthKit()
    await CapacitorHealthkit.requestAuthorization({
      all: ['workout', 'heartRate', 'activeEnergy', 'bodyMass'],
      read: ['workout', 'heartRate', 'activeEnergy', 'bodyMass'],
      write: ['workout'],
    })
    healthKitAvailable = true
    return true
  } catch {
    healthKitAvailable = false
    return false
  }
}

export async function getWorkoutsForDate(dateKey: string): Promise<HealthWorkout[]> {
  if (!healthKitAvailable || !Capacitor.isNativePlatform()) return []
  try {
    const CapacitorHealthkit = await getHealthKit()
    const start = new Date(dateKey + 'T00:00:00')
    const end = new Date(dateKey + 'T23:59:59')
    const result = await CapacitorHealthkit.queryWorkouts?.({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    })
    if (!result?.workouts) return []
    return result.workouts.map((w: Record<string, unknown>) => ({
      uuid: String(w.uuid || w.id || ''),
      activityType: String(w.activityType || w.workoutActivityType || 'other'),
      startDate: String(w.startDate),
      endDate: String(w.endDate),
      duration: Number(w.duration || 0),
      calories: w.totalEnergyBurned ? Number(w.totalEnergyBurned) : undefined,
    }))
  } catch {
    return []
  }
}

export async function getHeartRateForRange(
  start: string,
  end: string,
): Promise<HeartRateSample[]> {
  if (!healthKitAvailable || !Capacitor.isNativePlatform()) return []
  try {
    const CapacitorHealthkit = await getHealthKit()
    const result = await CapacitorHealthkit.queryHeartRate?.({
      startDate: start,
      endDate: end,
    })
    if (!result?.samples) return []
    return result.samples.map((s: Record<string, unknown>) => ({
      value: Number(s.value),
      startDate: String(s.startDate),
    }))
  } catch {
    return []
  }
}

export async function writeStrengthWorkout(opts: {
  startDate: string
  endDate: string
  calories?: number
}): Promise<string | null> {
  if (!healthKitAvailable || !Capacitor.isNativePlatform()) return null
  try {
    const CapacitorHealthkit = await getHealthKit()
    const result = await CapacitorHealthkit.saveWorkout?.({
      activityType: 'traditionalStrengthTraining',
      startDate: opts.startDate,
      endDate: opts.endDate,
      totalEnergyBurned: opts.calories || 200,
      totalDistance: 0,
    })
    return String(result?.uuid || result?.id || null)
  } catch {
    return null
  }
}
