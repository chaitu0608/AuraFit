import { useEffect } from 'react'
import { useDataStore } from '@/stores/dataStore'
import { useFoodStore } from '@/stores/foodStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Session, Template } from '@/lib/types'
import type { Meal, NutritionGoal } from '@/lib/food'
import { DEFAULT_NUTRITION_GOAL } from '@/lib/food'
import { remoteSessionsToLocal, remoteTemplatesToLocal } from '@/lib/remoteTransform'
import { key as dateKey } from '@/lib/utils'

export function useSyncEngine() {
  const session = useAuthStore((s) => s.session)
  const queue = useDataStore((s) => s.queue)
  const dequeue = useDataStore((s) => s.dequeue)
  const foodQueue = useFoodStore((s) => s.queue)
  const foodDequeue = useFoodStore((s) => s.dequeue)
  const setSyncStatus = useUIStore((s) => s.setSyncStatus)

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user) {
      setSyncStatus('local')
      return
    }

    async function flush() {
      const hasWork = queue.length > 0 || foodQueue.length > 0
      if (!hasWork) {
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
      for (const item of foodQueue) {
        try {
          if (item.type === 'meal' && item.action === 'upsert') {
            await upsertMealRemote(item.payload as Meal)
          }
          foodDequeue(item.id)
        } catch {
          setSyncStatus('err')
          return
        }
      }
      setSyncStatus('synced')
    }

    const t = setTimeout(flush, 1400)
    return () => clearTimeout(t)
  }, [queue, foodQueue, session, dequeue, foodDequeue, setSyncStatus])
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

async function upsertMealRemote(meal: Meal) {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) return

  const { data: savedMeal, error } = await supabase
    .from('meals')
    .upsert({
      id: meal.id,
      user_id: userId,
      date: meal.date,
      slot: meal.slot,
      notes: meal.notes,
    })
    .select()
    .single()

  if (error) throw error
  if (!savedMeal) return

  for (const log of meal.logs) {
    await supabase.from('food_logs').upsert({
      id: log.id,
      meal_id: savedMeal.id,
      food_id: log.food_id,
      raw_text: log.raw_text ?? log.name,
      qty: log.qty,
      unit: log.unit,
      grams: log.grams,
      kcal: log.kcal,
      protein_g: log.protein_g,
      carbs_g: log.carbs_g,
      fat_g: log.fat_g,
      ai_confidence: log.ai_confidence,
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

  const foodData = await loadRemoteFoodData(userId)

  return {
    sessions: remoteSessionsToLocal(sessions || []),
    templates: remoteTemplatesToLocal(templates || []),
    ...foodData,
  }
}

export async function loadRemoteFoodData(userId: string) {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceKey = dateKey(since)

  const { data: meals, error: mErr } = await supabase
    .from('meals')
    .select(`*, food_logs(*)`)
    .eq('user_id', userId)
    .gte('date', sinceKey)
    .order('date', { ascending: false })

  if (mErr) throw mErr

  const { data: goals, error: gErr } = await supabase
    .from('nutrition_goals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (gErr) throw gErr

  const mealsByDate: Record<string, Meal[]> = {}
  for (const row of meals || []) {
    const meal: Meal = {
      id: row.id,
      user_id: row.user_id,
      date: row.date,
      slot: row.slot,
      notes: row.notes,
      created_at: row.created_at,
      logs: (row.food_logs || []).map((log: Record<string, unknown>) => ({
        id: log.id as string,
        meal_id: log.meal_id as string,
        food_id: log.food_id as string | null,
        raw_text: log.raw_text as string | null,
        name: (log.raw_text as string) || undefined,
        qty: Number(log.qty),
        unit: log.unit as string,
        grams: log.grams as number | null,
        kcal: log.kcal as number | null,
        protein_g: log.protein_g as number | null,
        carbs_g: log.carbs_g as number | null,
        fat_g: log.fat_g as number | null,
        ai_confidence: log.ai_confidence as number | null,
        created_at: log.created_at as string,
      })),
    }
    if (!mealsByDate[meal.date]) mealsByDate[meal.date] = []
    mealsByDate[meal.date].push(meal)
  }

  return {
    mealsByDate,
    nutritionGoals: (goals as NutritionGoal | null) ?? DEFAULT_NUTRITION_GOAL,
  }
}

export function useRemoteHydration() {
  const session = useAuthStore((s) => s.session)
  const setSessions = useDataStore((s) => s.setSessions)
  const setTemplates = useDataStore((s) => s.setTemplates)
  const setMealsByDate = useFoodStore((s) => s.setMealsForDate)
  const setGoals = useFoodStore((s) => s.setGoals)
  const setSyncStatus = useUIStore((s) => s.setSyncStatus)

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user?.id) return

    let cancelled = false
    setSyncStatus('busy')

    loadRemoteData(session.user.id)
      .then(({ sessions, templates, mealsByDate, nutritionGoals }) => {
        if (cancelled) return
        setSessions(sessions)
        setTemplates(templates)
        for (const [dk, meals] of Object.entries(mealsByDate)) {
          setMealsByDate(dk, meals)
        }
        setGoals(nutritionGoals)
        setSyncStatus('synced')
      })
      .catch(() => {
        if (!cancelled) setSyncStatus('err')
      })

    return () => {
      cancelled = true
    }
  }, [session?.user?.id, setSessions, setTemplates, setMealsByDate, setGoals, setSyncStatus])
}
