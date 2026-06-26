import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, UtensilsCrossed } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { SectionHeader, Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { useUIStore } from '@/stores/uiStore'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import { useStaggerIn, useFadeIn, animateStreakFire } from '@/components/anime/hooks'
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

export function CalendarPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const month = useUIStore((s) => s.month)
  const setMonth = useUIStore((s) => s.setMonth)
  const sessions = useDataStore((s) => s.sessions)
  const mealsByDate = useFoodStore((s) => s.mealsByDate)
  const nutritionGoals = useFoodStore((s) => s.goals)
  const heroRef = useFadeIn<HTMLDivElement>([])
  const calRef = useStaggerIn<HTMLDivElement>([month.getMonth(), month.getFullYear()])
  const streakRef = useRef<HTMLSpanElement>(null)

  const week = computeWeekStats(sessions)
  const streak = computeStreak(sessions)
  const todayMeals = mealsForDate(mealsByDate, todayKey)
  const todayMacros = summariseDay(todayMeals)

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
        onClick={() => navigate(`/day/${k}`)}
        className={`aspect-square rounded-rs flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
          isToday
            ? 'bg-accent-dim border border-accent/40 ring-1 ring-accent/20'
            : s
              ? 'bg-surface2 border border-line'
              : 'hover:bg-surface2/60'
        }`}
      >
        <span className={`num text-[13px] font-medium ${isToday ? 'text-accent' : 'text-text'}`}>{d}</span>
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
    <AppShell hideNav={false}>
      <div ref={heroRef} className="mb-5">
        <p className="text-sm text-muted mb-0.5">{greeting()} · {APP_NAME}</p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[26px] font-bold tracking-tight">
            {profile?.display_name || profile?.handle || 'Lifter'}
          </h1>
          {streak > 0 && (
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="pill bg-accent-dim text-accent border border-accent/25 gap-1.5"
            >
              <Flame size={14} className="text-accent-warm" />
              <span ref={streakRef} className="num">
                {streak}
              </span>
            </button>
          )}
        </div>
      </div>

      <Card className="!p-4 mb-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="section-title">Today</div>
            <p className="section-sub mt-0.5">Nutrition & training</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/food')}
            className="pill bg-accent-dim text-accent border border-accent/25 gap-1.5 text-[12px] font-semibold"
          >
            <UtensilsCrossed size={14} />
            Log food
          </button>
        </div>
        <div className="flex justify-center">
          <MacroRings
            eaten={todayMacros}
            goals={nutritionGoals}
            volumeKg={week.volumeKg}
            volumeGoal={5000}
            compact
          />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 mb-5" data-stagger>
        <StatCard label="This week" value={week.sessions} unit="sessions" tone="accent" />
        <StatCard label="Sets" value={week.sets} />
        <StatCard label="Volume" value={week.volumeKg} unit="kg" />
      </div>

      <Card className="!p-4 mb-5">
        <SectionHeader title="Activity" subtitle="Last 7 days" />
        <WeeklyActivityBar sessions={sessions} days={week.days} />
      </Card>

      <SectionHeader
        title="Calendar"
        subtitle={`${MON[mo]} ${y}`}
        action={
          <div className="flex gap-1">
            <button type="button" className="icon-btn !w-8 !h-8" onClick={() => setMonth(new Date(y, mo - 1, 1))}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="icon-btn !w-8 !h-8" onClick={() => setMonth(new Date(y, mo + 1, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-7 gap-1 mb-1 px-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-center text-[10px] font-semibold text-faint uppercase">
            {d}
          </span>
        ))}
      </div>
      <div ref={calRef} className="grid grid-cols-7 gap-1 mb-4">
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
