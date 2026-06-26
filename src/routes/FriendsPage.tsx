import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, BarChart3 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field, SectionHeader, Empty } from '@/components/ui/Card'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { usePageEnter } from '@/components/anime/hooks'
import { hapticSuccess } from '@/lib/haptics'
import { showToast } from '@/components/ui/Toast'
import type { Friendship } from '@/lib/types'

export function FriendsPage() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const navigate = useNavigate()
  const [handle, setHandle] = useState('')
  const [friends, setFriends] = useState<Friendship[]>([])
  const [pending, setPending] = useState<Friendship[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const pageRef = usePageEnter<HTMLDivElement>([])

  useEffect(() => {
    if (userId) load()
  }, [userId])

  async function load() {
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester.eq.${userId},addressee.eq.${userId}`)
    const rows = data || []
    setFriends(rows.filter((f) => f.status === 'accepted') as Friendship[])
    setPending(rows.filter((f) => f.status === 'pending' && f.addressee === userId) as Friendship[])
  }

  async function sendRequest() {
    if (!handle.trim() || !userId) return
    setMessage(null)
    const { data: target } = await supabase
      .from('profiles')
      .select('id, handle')
      .eq('handle', handle.trim().toLowerCase())
      .maybeSingle()
    if (!target) {
      showToast('User not found — check the @handle.', 'error')
      return
    }
    await supabase.from('friendships').insert({
      requester: userId,
      addressee: target.id,
      status: 'pending',
    })
    setHandle('')
    showToast(`Request sent to @${target.handle}`, 'success')
    void hapticSuccess()
  }

  async function accept(id: string) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
    void hapticSuccess()
    load()
  }

  return (
    <AppShell title="Friends" showBack onBack={() => navigate('/feed')} fab={false} hero>
      <div ref={pageRef}>
      <SurfaceCard className="!p-4 mb-4">
        <Field label="Add by username">
          <div className="flex gap-2">
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@friend" />
            <Button variant="primary" className="!w-auto px-4" onClick={sendRequest}>
              <UserPlus size={18} />
            </Button>
          </div>
        </Field>
        {message && <p className="text-[13px] text-muted mt-3">{message}</p>}
      </SurfaceCard>

      {pending.length > 0 && (
        <>
          <SectionHeader title="Requests" />
          {pending.map((f) => (
            <SurfaceCard key={f.id} className="!p-4 mb-2 flex justify-between items-center">
              <span className="text-sm font-medium">Wants to train together</span>
              <Button size="sm" variant="primary" onClick={() => accept(f.id)}>Accept</Button>
            </SurfaceCard>
          ))}
        </>
      )}

      <SectionHeader title="Training partners" subtitle={`${friends.length} connected`} />
      {friends.length ? (
        friends.map((f) => (
          <SurfaceCard key={f.id} className="!p-4 mb-2 flex items-center gap-3">
            <Avatar handle="friend" size="md" />
            <div className="flex-1">
              <p className="font-semibold">Gym partner</p>
              <Badge tone="ok">Connected</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/compare')}>
              <BarChart3 size={16} /> PRs
            </Button>
          </SurfaceCard>
        ))
      ) : (
        <Empty title="No friends yet" subtitle="Add someone by their @handle to share workouts and compare PRs." />
      )}
      </div>
    </AppShell>
  )
}
