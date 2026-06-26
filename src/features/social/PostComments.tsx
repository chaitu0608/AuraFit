import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { PostComment } from '@/lib/types'

export function PostComments({ postId }: { postId: string }) {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [comments, setComments] = useState<PostComment[]>([])
  const [body, setBody] = useState('')

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  async function load() {
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles:profiles(handle, display_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setComments((data as PostComment[]) || [])
  }

  async function submit() {
    if (!body.trim() || !userId) return
    await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: userId,
      body: body.trim(),
    })
    setBody('')
    load()
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      {comments.map((c) => (
        <div key={c.id} className="text-sm mb-2">
          <span className="font-medium text-accent">@{c.profile?.handle}</span>{' '}
          <span className="text-muted">{c.body}</span>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="text-sm py-2"
        />
        <Button size="sm" variant="primary" className="w-auto px-3" onClick={submit}>
          Post
        </Button>
      </div>
    </div>
  )
}
