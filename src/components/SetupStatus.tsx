import { isSupabaseConfigured } from '@/lib/supabase'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function SetupStatus() {
  const syncStatus = useUIStore((s) => s.syncStatus)
  const profile = useAuthStore((s) => s.profile)
  const isLocal = !isSupabaseConfigured

  const items = [
    { label: 'Cloud sync', ok: isSupabaseConfigured, hint: isLocal ? 'Add anon key' : 'Connected' },
    { label: 'Database', ok: !isLocal && syncStatus !== 'err', hint: syncStatus === 'err' ? 'Run migration' : 'Ready' },
    { label: 'Account', ok: !!profile, hint: profile ? `@${profile.handle}` : 'Sign in' },
  ]

  return (
    <Card className="!p-4 mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Status</p>
      {items.map((item) => (
        <div key={item.label} className="flex justify-between items-center py-2 border-b border-line last:border-0">
          <span className="text-sm">{item.label}</span>
          <Badge tone={item.ok ? 'ok' : 'warn'}>{item.hint}</Badge>
        </div>
      ))}
    </Card>
  )
}
