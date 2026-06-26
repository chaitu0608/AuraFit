import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, UtensilsCrossed, Dumbbell } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { SectionHeader } from '@/components/ui/Card'
import { MetricHero } from '@/components/ui/MetricHero'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import { useStaggerIn, usePageEnter, animateStreakFire, useTapBurst } from '@/components/anime/hooks'
import { MON, key, todayKey } from '@/lib/utils'
import { colorFor } from '@/lib/summarise'
import { computeWeekStats, computeStreak } from '@/lib/stats'
import { APP_NAME } from '@/lib/brand'
import { WeeklyActivityBar } from '@/features/home/WeeklyActivityBar'
import { MacroRings } from '@/features/food/MacroRings'
import { useFoodStore } from '@/stores/foodStore'
import { mealsForDate, summariseDay } from '@/lib/food'
import type { Session } from '@/lib/types'
import { useEffect, useRef } from 'react'
import { hapticLight } from '@/lib/haptics'

export function CalendarPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const month = useUIStore((s) => s.month)
  const setMonth = useUIStore((s) => s.setMonth)
  const sessions = useDataStore((s) => s.sessions)
  const mealsByDate = useFoodStore((s) => s.mealsByDate)
  const nutritionGoals = useFoodStore((s) => s.goals)
  const heroRef = usePageEnter<HTMLDivElement>([])
  const calRef = useStaggerIn<HTMLDivElement>([month.getMonth(), month.getFullYear()])
  const streakRef = useRef<HTMLSpanElement>(null)
  const onDayTap = useTapBurst()

  const week = computeWeekStats(sessions)
  const streak = computeStreak(sessions)
  const todayMeals = mealsForDate(mealsByDate, todayKey)
  const todayMacros = summariseDay(todayMeals)
  const todaySession = sessions[todayKey] as Session | undefined

  useEffect(() => {
    if (streak > 0 && streakRef.current) animateStreakFire(streakRef.current)
  }, [streak])

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

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <AppShell hideNav={false} hero>
      <div ref={heroRef} className="mb-6">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-widest mb-1">
          {greeting()} · {APP_NAME}
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-[32px] font-extrabold tracking-tight leading-none">
            {profile?.display_name || profile?.handle || 'Athlete'}
          </h1>
          {streak > 0 && (
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="pill bg-accent-dim text-accent border border-accent/30 gap-1.5 shadow-glow-sm active:scale-95 transition-transform"
            >
              <Flame size={16} className="text-accent-warm" />
              <span ref={streakRef} className="num font-bold">
                {streak}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <MetricHero label="Week" value={week.sessions} unit="sessions" />
        <MetricHero label="Sets" value={week.sets} />
        <MetricHero label="Volume" value={week.volumeKg} unit="kg" />
      </div>

      <SurfaceCard active className="mb-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="font-display text-[17px] font-bold">Today</div>
            <p className="text-[12px] text-muted mt-0.5">
              {todaySession ? 'Workout logged' : 'No workout yet'} · {todayMacros.kcal} kcal
            </p>
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <MacroRings
            eaten={todayMacros}
            goals={nutritionGoals}
            volumeKg={week.volumeKg}
            volumeGoal={5000}
            compact
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => {
              void hapticLight()
              navigate('/food')
            }}
          >
            <UtensilsCrossed size={16} />
            Log food
          </Button>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => {
              void hapticLight()
              navigate(`/day/${todayKey}`)
            }}
          >
            <Dumbbell size={16} />
            {todaySession ? 'View workout' : 'Start workout'}
          </Button>
        </div>
      </SurfaceCard>

      <SurfaceCard className="mb-5">
        <SectionHeader title="Activity" subtitle="Last 7 days" />
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

      <div className="flex flex-wrap gap-2">
        {[
          ['push', 'Push', 'push'],
          ['pull', 'Pull', 'pull'],
          ['leg', 'Legs', 'leg'],
          ['cardio', 'Cardio', 'cardio'],
        ].map(([, label, tone]) => (
          <Badge key={label} tone={tone as 'push'}>
            {label}
          </Badge>
        ))}
      </div>
    </AppShell>
  )
}
