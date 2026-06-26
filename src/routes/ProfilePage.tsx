import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Dumbbell,
  List,
  Trophy,
  Download,
  ChevronRight,
  Users,
  BarChart3,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { SectionHeader } from '@/components/ui/Card'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { Avatar } from '@/components/ui/Avatar'
import { MetricHero } from '@/components/ui/MetricHero'
import { SetupStatus } from '@/components/SetupStatus'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { computeWeekStats, computeStreak } from '@/lib/stats'
import { usePageEnter } from '@/components/anime/hooks'
import { APP_EXPORT_PREFIX } from '@/lib/brand'

function MenuRow({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: typeof Settings
  label: string
  sub?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3.5 border-b border-line last:border-0 text-left active:opacity-70"
    >
      <div className="w-9 h-9 rounded-rs bg-surface2 border border-line flex items-center justify-center text-muted">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium">{label}</div>
        {sub && <div className="text-xs text-muted truncate">{sub}</div>}
      </div>
      <ChevronRight size={18} className="text-faint shrink-0" />
    </button>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const sessions = useDataStore((s) => s.sessions)
  const templates = useDataStore((s) => s.templates)
  const heroRef = usePageEnter<HTMLDivElement>([])
  const week = computeWeekStats(sessions)
  const streak = computeStreak(sessions)

  function exportData() {
    const blob = new Blob([JSON.stringify({ sessions, templates, profile }, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${APP_EXPORT_PREFIX}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <AppShell title="You" fab={false} hero>
      <div ref={heroRef}>
        <SurfaceCard className="!p-5 mb-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.display_name} handle={profile?.handle} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold tracking-tight truncate">
                {profile?.display_name || 'Your profile'}
              </h2>
              <p className="text-sm text-accent font-medium">@{profile?.handle || 'demo'}</p>
              <p className="text-xs text-muted mt-1">
                {Object.keys(sessions).length} days logged · {templates.length} routines
              </p>
            </div>
          </div>
        </SurfaceCard>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <MetricHero label="Streak" value={streak} unit="days" />
          <MetricHero label="This week" value={week.sessions} unit="workouts" />
        </div>

        <SetupStatus />

        <SectionHeader title="Training" className="mt-2" />
        <SurfaceCard className="!p-0 !px-4 mb-4">
          <MenuRow icon={Dumbbell} label="My routines" sub="Templates & programs" onClick={() => navigate('/workouts')} />
          <MenuRow icon={List} label="Exercise library" sub="Types, rename, merge" onClick={() => navigate('/exercises')} />
          <MenuRow icon={Trophy} label="Programs & challenges" onClick={() => navigate('/programs')} />
          <MenuRow icon={BarChart3} label="Compare PRs" onClick={() => navigate('/compare')} />
        </SurfaceCard>

        <SectionHeader title="Community" />
        <SurfaceCard className="!p-0 !px-4 mb-4">
          <MenuRow icon={Users} label="Friends" sub="Add gym partners by handle" onClick={() => navigate('/friends')} />
        </SurfaceCard>

        <SectionHeader title="App" />
        <SurfaceCard className="!p-0 !px-4">
          <MenuRow icon={Settings} label="Settings & sync" onClick={() => navigate('/settings')} />
          <MenuRow icon={Download} label="Export backup" onClick={exportData} />
        </SurfaceCard>
      </div>
    </AppShell>
  )
}
