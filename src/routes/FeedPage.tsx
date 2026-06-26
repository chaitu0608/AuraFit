import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, UserPlus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { SectionHeader, Empty } from '@/components/ui/Card'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useStaggerIn } from '@/components/anime/hooks'
import { PostComments } from '@/features/social/PostComments'
import { WeeklyRecapCard } from '@/features/social/WeeklyRecapCard'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import type { Post, ReactionKind } from '@/lib/types'

const REACTIONS: { kind: ReactionKind; emoji: string }[] = [
  { kind: 'heart', emoji: '❤️' },
  { kind: 'fire', emoji: '🔥' },
  { kind: 'muscle', emoji: '💪' },
  { kind: 'clap', emoji: '👏' },
]

export function FeedPage() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const feedRef = useStaggerIn<HTMLDivElement>([posts.length])

  useEffect(() => {
    if (!userId) return
    loadPosts()
    const channel = supabase
      .channel('feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => loadPosts())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles:profiles(handle, display_name, avatar_url), post_reactions(*)')
      .order('created_at', { ascending: false })
      .limit(50)
    setPosts((data as Post[]) || [])
  }

  async function react(postId: string, kind: ReactionKind) {
    if (!userId) return
    try { await Haptics.impact({ style: ImpactStyle.Light }) } catch { /* web */ }
    await supabase.from('post_reactions').upsert({ post_id: postId, user_id: userId, kind })
    loadPosts()
  }

  return (
    <AppShell hero>
      <SectionHeader
        title="Community"
        subtitle="Workouts from you & friends"
        action={
          <button type="button" className="icon-btn" onClick={() => navigate('/friends')}>
            <UserPlus size={18} />
          </button>
        }
      />

      <WeeklyRecapCard />

      <div ref={feedRef}>
        {posts.length ? (
          posts.map((p) => (
            <SurfaceCard key={p.id} data-stagger className="!p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <Avatar handle={p.profile?.handle} name={p.profile?.display_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">@{p.profile?.handle || 'user'}</span>
                  <Badge tone={p.kind === 'pr' ? 'accent' : 'default'} className="ml-2 !py-0.5">
                    {p.kind}
                  </Badge>
                </div>
              </div>
              <p className="text-[15px] leading-relaxed mb-3">{p.body}</p>
              <div className="flex gap-1.5 mb-1">
                {REACTIONS.map(({ kind, emoji }) => (
                  <button
                    key={kind}
                    type="button"
                    className="w-9 h-9 rounded-rs bg-surface2 border border-line text-base active:scale-95 transition-transform"
                    onClick={() => react(p.id, kind)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <PostComments postId={p.id} />
            </SurfaceCard>
          ))
        ) : (
          <Empty
            title="No activity yet"
            subtitle="Log a workout or add a friend to see the feed."
            action={
              <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/friends')}>
                <MessageCircle size={16} /> Find friends
              </button>
            }
          />
        )}
      </div>
    </AppShell>
  )
}
