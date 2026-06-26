import { useEffect } from 'react'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Session, Template } from '@/lib/types'
import { remoteSessionsToLocal, remoteTemplatesToLocal } from '@/lib/remoteTransform'

export function useSyncEngine() {
  const session = useAuthStore((s) => s.session)
  const queue = useDataStore((s) => s.queue)
  const dequeue = useDataStore((s) => s.dequeue)
  const setSyncStatus = useUIStore((s) => s.setSyncStatus)

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user) {
      setSyncStatus('local')
      return
    }

    async function flush() {
      if (!queue.length) {
        setSyncStatus('synced')
        return
      }
      setSyncStatus('busy')
      for (const item of queue) {
        try {
          if (item.type === 'session' && item.action === 'upsert') {
            await upsertSessionRemote(item.payload as Session)
          } else if (item.type === 'template' && item.action === 'upsert') {
            await upsertTemplateRemote(item.payload as Template)
          }
          dequeue(item.id)
        } catch {
          setSyncStatus('err')
          return
        }
      }
      setSyncStatus('synced')
    }

    const t = setTimeout(flush, 1400)
    return () => clearTimeout(t)
  }, [queue, session, dequeue, setSyncStatus])
}

async function upsertSessionRemote(session: Session) {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) return

  const { data: sess, error } = await supabase
    .from('sessions')
    .upsert({
      id: session.id,
      user_id: userId,
      date: session.date,
      kind: session.kind,
      name: session.name,
      notes: session.notes,
      source: session.source || 'manual',
      healthkit_uuid: session.healthkit_uuid,
    })
    .select()
    .single()

  if (error) throw error
  if (!sess || !session.exercises?.length) return

  for (let ei = 0; ei < session.exercises.length; ei++) {
    const ex = session.exercises[ei]
    const exerciseId = await ensureExercise(ex.name, userId)
    const { data: sex, error: sexErr } = await supabase
      .from('session_exercises')
      .upsert({
        id: ex.id,
        session_id: sess.id,
        exercise_id: exerciseId,
        position: ei,
        notes: ex.notes,
      })
      .select()
      .single()

    if (sexErr || !sex) throw sexErr || new Error('session_exercise upsert failed')

    for (let si = 0; si < ex.sets.length; si++) {
      const set = ex.sets[si]
      await supabase.from('sets').upsert({
        id: set.id,
        session_exercise_id: sex.id,
        position: si,
        weight_kg: set.weight_kg ?? set.w,
        reps: set.reps ?? set.r,
        plates: set.plates ?? set.p,
        is_assisted: set.is_assisted ?? false,
        drop_of_id: set.drop_of_id,
        rpe: set.rpe,
      })
    }
  }
}

async function upsertTemplateRemote(template: Template) {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) return

  const { data: tpl, error: tplErr } = await supabase
    .from('templates')
    .upsert({
      id: template.id,
      user_id: userId,
      name: template.name,
      is_shared: template.is_shared ?? false,
    })
    .select()
    .single()

  if (tplErr || !tpl) throw tplErr || new Error('template upsert failed')

  await supabase.from('template_exercises').delete().eq('template_id', tpl.id)
  for (let i = 0; i < template.exercises.length; i++) {
    const name = template.exercises[i]
    const exerciseId = await ensureExercise(name, userId)
    await supabase.from('template_exercises').insert({
      template_id: tpl.id,
      exercise_id: exerciseId,
      position: i,
    })
  }
}

async function ensureExercise(name: string, userId: string): Promise<string> {
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-')
  const { data: existing } = await supabase
    .from('exercises')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('exercises')
    .insert({ slug, name: name.trim(), owner_id: userId })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function loadRemoteData(userId: string) {
  const { data: sessions, error: sErr } = await supabase
    .from('sessions')
    .select(`*, session_exercises(*, exercises(name), sets(*))`)
    .eq('user_id', userId)

  const { data: templates, error: tErr } = await supabase
    .from('templates')
    .select(`*, template_exercises(*, exercises(name))`)
    .eq('user_id', userId)

  if (sErr) throw sErr
  if (tErr) throw tErr

  return {
    sessions: remoteSessionsToLocal(sessions || []),
    templates: remoteTemplatesToLocal(templates || []),
  }
}

export function useRemoteHydration() {
  const session = useAuthStore((s) => s.session)
  const setSessions = useDataStore((s) => s.setSessions)
  const setTemplates = useDataStore((s) => s.setTemplates)
  const setSyncStatus = useUIStore((s) => s.setSyncStatus)

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user?.id) return

    let cancelled = false
    setSyncStatus('busy')

    loadRemoteData(session.user.id)
      .then(({ sessions, templates }) => {
        if (cancelled) return
        setSessions(sessions)
        setTemplates(templates)
        setSyncStatus('synced')
      })
      .catch(() => {
        if (!cancelled) setSyncStatus('err')
      })

    return () => {
      cancelled = true
    }
  }, [session?.user?.id, setSessions, setTemplates, setSyncStatus])
}
