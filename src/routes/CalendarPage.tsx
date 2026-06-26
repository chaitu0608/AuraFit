import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, UtensilsCrossed, Dumbbell } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { SectionHeader } from '@/components/ui/Card'
import { MetricHero } from '@/components/ui/MetricHero'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import { useStaggerIn, useTapBurst } from '@/components/anime/hooks'
import { MON, key, todayKey } from '@/lib/utils'
import { colorFor } from '@/lib/summarise'
import {
  computeWeekStats,
  computeActiveStreak,
  computeVolumeBaseline,
  computeWeekComparison,
  computeDailyProgress,
  formatDeltaSessions,
  formatDeltaVolume,
} from '@/lib/stats'
import { buildHomeHeadline, buildHomeSubline, buildTodaySummary } from '@/lib/insights'
import { ScoreboardHero } from '@/features/home/ScoreboardHero'
import { WeeklyActivityBar } from '@/features/home/WeeklyActivityBar'
import { MacroRings } from '@/features/food/MacroRings'
import { useFoodStore } from '@/stores/foodStore'
import { mealsForDate, summariseDay } from '@/lib/food'
import type { Session } from '@/lib/types'
import { hapticLight } from '@/lib/haptics'
import { cn } from '@/lib/utils'

export function CalendarPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const month = useUIStore((s) => s.month)
  const setMonth = useUIStore((s) => s.setMonth)
  const sessions = useDataStore((s) => s.sessions)
  const mealsByDate = useFoodStore((s) => s.mealsByDate)
  const nutritionGoals = useFoodStore((s) => s.goals)
  const calRef = useStaggerIn<HTMLDivElement>([month.getMonth(), month.getFullYear()])
  const onDayTap = useTapBurst()

  const week = computeWeekStats(sessions)
  const comparison = computeWeekComparison(sessions)
  const streak = computeActiveStreak(sessions)
  const volumeBaseline = computeVolumeBaseline(sessions)
  const progress = computeDailyProgress(sessions, mealsByDate, nutritionGoals, todayKey)
  const todayMeals = mealsForDate(mealsByDate, todayKey)
  const todayMacros = summariseDay(todayMeals)
  const todaySession = sessions[todayKey] as Session | undefined

  const headline = buildHomeHeadline(
    sessions,
    mealsByDate,
    nutritionGoals,
    todayKey,
    week,
    profile?.display_name || profile?.handle,
  )
  const subline = buildHomeSubline(sessions, streak, week)
  const todaySummary = buildTodaySummary(sessions, mealsByDate, nutritionGoals, todayKey)

  const proteinLow = todayMacros.protein_g < nutritionGoals.protein_g * 0.7
  const needsWorkout = !progress.trainedToday && !progress.restToday

  const y = month.getFullYear()
  const mo = month.getMonth()
  const start = new Date(y, mo, 1).getDay()
  const dim = new Date(y, mo + 1, 0).getDate()

  const cells: React.ReactNode[] = []
  for (let i = 0; i < start; i++) {
    cells.push(<div key={`e-${i}`} className="aspect-square" />)
  }
  for (let d = 1; d <= dim; d++) {
    const k = key(new Date(y, mo, d))
    const s = sessions[k] as Session | undefined
    const col = colorFor(s || null)
    const isToday = k === todayKey
    cells.push(
      <button
        key={k}
        type="button"
        data-stagger
        onPointerDown={onDayTap}
        onClick={() => {
          void hapticLight()
          navigate(`/day/${k}`)
        }}
        className={`aspect-square rounded-rs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${
          isToday
            ? 'bg-accent-dim border border-accent/50 shadow-glow-sm'
            : s
              ? 'bg-surface2 border border-line'
              : 'border border-transparent hover:bg-surface2/80'
        }`}
      >
        <span className={`num text-[13px] font-bold ${isToday ? 'text-accent' : 'text-text'}`}>{d}</span>
        {col && <span className="w-1.5 h-1.5 rounded-full" style={{ background: col }} />}
      </button>,
    )
  }

  return (
    <AppShell hideNav={false} hero>
      <ScoreboardHero
        score={progress.score}
        headline={headline}
        subline={subline}
        streak={streak}
      />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <MetricHero
          label="Week"
          value={week.sessions}
          unit="sessions"
          delta={formatDeltaSessions(comparison.deltaSessions)}
        />
        <MetricHero
          label="Sets"
          value={week.sets}
          delta={
            comparison.deltaSets === 0
              ? undefined
              : comparison.deltaSets > 0
                ? `+${comparison.deltaSets} sets`
                : `${comparison.deltaSets} sets`
          }
        />
        <MetricHero
          label="Volume"
          value={week.volumeKg}
          unit="kg"
          delta={formatDeltaVolume(comparison.deltaVolumePct)}
        />
      </div>

      <SurfaceCard active className="mb-5">
        <div className="mb-4">
          <div className="font-display text-[17px] font-bold">Today</div>
          <p className="text-[12px] text-muted mt-0.5">{todaySummary}</p>
        </div>
        <div className="flex justify-center mb-4">
          <MacroRings
            eaten={todayMacros}
            goals={nutritionGoals}
            volumeKg={week.volumeKg}
            volumeGoal={volumeBaseline}
            compact
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={proteinLow ? 'primary' : 'secondary'}
            className={cn('gap-2', proteinLow && 'shadow-glow-sm')}
            onClick={() => {
              void hapticLight()
              navigate('/food')
            }}
          >
            <UtensilsCrossed size={16} />
            Log food
          </Button>
          <Button
            variant={needsWorkout ? 'primary' : 'secondary'}
            className={cn('gap-2', needsWorkout && 'shadow-glow-sm')}
            onClick={() => {
              void hapticLight()
              navigate(`/day/${todayKey}`)
            }}
          >
            <Dumbbell size={16} />
            {todaySession?.kind === 'workout' || todaySession?.kind === 'cardio'
              ? 'View workout'
              : 'Start workout'}
          </Button>
        </div>
      </SurfaceCard>

      <SurfaceCard className="mb-5">
        <SectionHeader title="Activity" subtitle={`${week.volumeKg.toLocaleString()} kg · 7 days`} />
        <WeeklyActivityBar sessions={sessions} days={week.days} />
      </SurfaceCard>

      <SectionHeader
        title="Calendar"
        subtitle={`${MON[mo]} ${y}`}
        action={
          <div className="flex gap-1">
            <button
              type="button"
              className="icon-btn !w-8 !h-8"
              onClick={() => setMonth(new Date(y, mo - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="icon-btn !w-8 !h-8"
              onClick={() => setMonth(new Date(y, mo + 1, 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-7 gap-1 mb-1 px-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-center text-[10px] font-bold text-faint uppercase">
            {d}
          </span>
        ))}
      </div>
      <div ref={calRef} className="grid grid-cols-7 gap-1.5 mb-4">
        {cells}
      </div>
    </AppShell>
  )
}
