import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import { SetupStatus } from '@/components/SetupStatus'
import { APP_EXPORT_PREFIX } from '@/lib/brand'

export function SettingsPage() {
  const navigate = useNavigate()
  const sessions = useDataStore((s) => s.sessions)
  const templates = useDataStore((s) => s.templates)
  const profile = useAuthStore((s) => s.profile)
  const sessCount = Object.keys(sessions).length

  function exportData() {
    const data = { sessions, templates, profile }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${APP_EXPORT_PREFIX}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <AppShell title="Settings">
      <SetupStatus />
      {profile && (
        <div className="card mb-4">
          <div className="font-semibold">@{profile.handle}</div>
          <div className="text-sm text-muted">{profile.display_name}</div>
        </div>
      )}
      <Button variant="ghost" className="mb-4" onClick={() => navigate('/exercises')}>
        Manage exercises & input types
      </Button>
      <Button variant="ghost" className="mb-4" onClick={() => navigate('/programs')}>
        Programs & challenges
      </Button>
      <div className="eyebrow">Backup</div>
      <div className="card">
        <div className="flex justify-between mb-3 text-sm text-muted">
          <span>
            {sessCount} day{sessCount === 1 ? '' : 's'} logged · {templates.length} workout
            {templates.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" className="flex-1" onClick={exportData}>
            Export file
          </Button>
        </div>
      </div>
      <p className="text-faint text-xs mt-6 text-center">
        Data syncs to Supabase when signed in. Apple Health sync on session save.
      </p>
    </AppShell>
  )
}
