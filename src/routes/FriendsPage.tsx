import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, BarChart3 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field, Card, SectionHeader, Empty } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Friendship } from '@/lib/types'

export function FriendsPage() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const navigate = useNavigate()
  const [handle, setHandle] = useState('')
  const [friends, setFriends] = useState<Friendship[]>([])
  const [pending, setPending] = useState<Friendship[]>([])

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
    const { data: target } = await supabase
      .from('profiles')
      .select('id, handle')
      .eq('handle', handle.trim().toLowerCase())
      .maybeSingle()
    if (!target) {
      alert('User not found.')
      return
    }
    await supabase.from('friendships').insert({
      requester: userId,
      addressee: target.id,
      status: 'pending',
    })
    setHandle('')
    alert(`Request sent to @${target.handle}`)
  }

  async function accept(id: string) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
    load()
  }

  return (
    <AppShell title="Friends" showBack onBack={() => navigate('/feed')} fab={false}>
      <Card className="!p-4 mb-4">
        <Field label="Add by username">
          <div className="flex gap-2">
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@friend" />
            <Button variant="primary" className="!w-auto px-4" onClick={sendRequest}>
              <UserPlus size={18} />
            </Button>
          </div>
        </Field>
      </Card>

      {pending.length > 0 && (
        <>
          <SectionHeader title="Requests" />
          {pending.map((f) => (
            <Card key={f.id} className="!p-4 flex justify-between items-center">
              <span className="text-sm">Wants to train together</span>
              <Button size="sm" variant="primary" onClick={() => accept(f.id)}>Accept</Button>
            </Card>
          ))}
        </>
      )}

      <SectionHeader title="Training partners" subtitle={`${friends.length} connected`} />
      {friends.length ? (
        friends.map((f) => (
          <Card key={f.id} className="!p-4 flex items-center gap-3">
            <Avatar handle="friend" size="md" />
            <div className="flex-1">
              <p className="font-medium">Gym partner</p>
              <Badge tone="ok">Connected</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/compare')}>
              <BarChart3 size={16} /> PRs
            </Button>
          </Card>
        ))
      ) : (
        <Empty title="No friends yet" subtitle="Add someone by their @handle to share workouts and compare PRs." />
      )}
    </AppShell>
  )
}
