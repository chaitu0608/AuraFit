import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Profile } from '@/lib/types'

const demoProfile: Profile = {
  id: 'local-demo',
  handle: 'demo',
  display_name: 'Demo User',
  avatar_url: null,
  units: 'kg',
  bio: null,
  share_workouts: true,
  auto_post_workout: true,
  auto_post_pr: true,
  auto_post_streak: true,
}

export function useAuth() {
  const { session, profile, loading, setSession, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession({ user: { id: 'local-demo' } } as never)
      setProfile(demoProfile)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) loadProfile(data.session.user.id)
      else setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      if (sess?.user) loadProfile(sess.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile((data as Profile | null) || null)
    setLoading(false)
  }

  return { session, profile, loading, isLocalOnly: !isSupabaseConfigured }
}
