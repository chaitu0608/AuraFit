import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Field } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAnimatedNumber } from '@/components/anime/hooks'
import type { PR } from '@/lib/types'

export function ComparePage() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [exercise, setExercise] = useState('')
  const [myPr, setMyPr] = useState<PR | null>(null)
  const [friendPr, setFriendPr] = useState<PR | null>(null)
  const myRef = useAnimatedNumber(myPr?.est_1rm || 0)
  const friendRef = useAnimatedNumber(friendPr?.est_1rm || 0)

  useEffect(() => {
    if (!exercise.trim() || !userId) return
    loadComparison()
  }, [exercise, userId])

  async function loadComparison() {
    const { data: ex } = await supabase
      .from('exercises')
      .select('id')
      .ilike('name', exercise.trim())
      .maybeSingle()
    if (!ex) return

    const { data: mine } = await supabase
      .from('prs')
      .select('*')
      .eq('user_id', userId!)
      .eq('exercise_id', ex.id)
      .order('est_1rm', { ascending: false })
      .limit(1)
      .maybeSingle()
    setMyPr(mine as PR | null)

    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester, addressee')
      .eq('status', 'accepted')
      .or(`requester.eq.${userId},addressee.eq.${userId}`)
      .limit(1)

    const friendId = friendships?.[0]
      ? friendships[0].requester === userId
        ? friendships[0].addressee
        : friendships[0].requester
      : null

    if (friendId) {
      const { data: theirs } = await supabase
        .from('prs')
        .select('*')
        .eq('user_id', friendId)
        .eq('exercise_id', ex.id)
        .order('est_1rm', { ascending: false })
        .limit(1)
        .maybeSingle()
      setFriendPr(theirs as PR | null)
    }
  }

  return (
    <AppShell title="PR Comparison" showBack>
      <Field label="Exercise name">
        <input
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          placeholder="e.g. Bench press"
          className="w-full"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="card text-center">
          <div className="text-xs text-muted mb-1">You</div>
          <div ref={myRef as React.RefObject<HTMLDivElement>} className="text-2xl font-semibold num text-accent">
            {myPr?.est_1rm || '—'}
          </div>
          <div className="text-xs text-muted">est. 1RM kg</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-muted mb-1">Friend</div>
          <div ref={friendRef as React.RefObject<HTMLDivElement>} className="text-2xl font-semibold num text-pull">
            {friendPr?.est_1rm || '—'}
          </div>
          <div className="text-xs text-muted">est. 1RM kg</div>
        </div>
      </div>
      <div className="eyebrow mt-6">Weekly volume leaderboard</div>
      <Leaderboard />
    </AppShell>
  )
}

function Leaderboard() {
  const [rows, setRows] = useState<{ handle: string; volume: number }[]>([])

  useEffect(() => {
    async function load() {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data } = await supabase
        .from('sessions')
        .select('user_id, profiles(handle)')
        .gte('date', weekAgo.toISOString().slice(0, 10))
        .eq('kind', 'workout')
      const counts = new Map<string, number>()
      ;(data || []).forEach((s: { user_id: string }) => {
        counts.set(s.user_id, (counts.get(s.user_id) || 0) + 1)
      })
      setRows(
        [...counts.entries()].map(([_, volume]) => ({
          handle: 'friend',
          volume,
        })),
      )
    }
    load()
  }, [])

  return (
    <div className="card">
      {rows.length ? (
        rows.map((r, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-line last:border-0">
            <span>@{r.handle}</span>
            <span className="num font-medium">{r.volume} sessions</span>
          </div>
        ))
      ) : (
        <p className="text-muted text-sm">No data this week.</p>
      )}
    </div>
  )
}
