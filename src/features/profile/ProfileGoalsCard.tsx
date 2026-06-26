import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Card'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { useAuthStore } from '@/stores/authStore'
import { useFoodStore } from '@/stores/foodStore'
import {
  TRAINING_GOALS,
  displayWeightToKg,
  kgToDisplayWeight,
  macrosFromBody,
  persistProfileGoals,
  type TrainingGoal,
} from '@/lib/goals'
import { showToast } from '@/components/ui/Toast'
import { hapticSuccess } from '@/lib/haptics'
import type { NutritionGoal } from '@/lib/food'

export function ProfileGoalsCard() {
  const profile = useAuthStore((s) => s.profile)
  const session = useAuthStore((s) => s.session)
  const goals = useFoodStore((s) => s.goals)
  const setGoals = useFoodStore((s) => s.setGoals)
  const setProfile = useAuthStore((s) => s.setProfile)

  const units = profile?.units ?? 'kg'
  const [trainingGoal, setTrainingGoal] = useState<TrainingGoal>(
    profile?.training_goal ?? 'maintain',
  )
  const [bodyWeight, setBodyWeight] = useState(
    profile?.body_weight_kg
      ? String(kgToDisplayWeight(profile.body_weight_kg, units))
      : units === 'lb'
        ? '154'
        : '70',
  )
  const [macros, setMacros] = useState<NutritionGoal>(goals)
  const [advanced, setAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMacros(goals)
  }, [goals])

  useEffect(() => {
    const w = parseFloat(bodyWeight)
    if (!w || w <= 0) return
    if (!advanced) {
      setMacros(macrosFromBody(displayWeightToKg(w, units), trainingGoal))
    }
  }, [bodyWeight, trainingGoal, units, advanced])

  async function save() {
    if (!session?.user?.id || !profile) return
    const w = parseFloat(bodyWeight)
    if (!w || w <= 0) {
      showToast('Enter a valid body weight', 'error')
      return
    }
    setSaving(true)
    try {
      const weightKg = displayWeightToKg(w, units)
      await persistProfileGoals(session.user.id, weightKg, trainingGoal, macros)
      setGoals(macros)
      setProfile({ ...profile, body_weight_kg: weightKg, training_goal: trainingGoal })
      showToast('Goals updated', 'success')
      void hapticSuccess()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SurfaceCard className="!p-4 mb-4">
      <div className="font-display text-[17px] font-bold mb-1">Goals</div>
      <p className="text-[12px] text-muted mb-4">Macros and scoreboard targets</p>

      <Field label={`Body weight (${units})`}>
        <Input
          type="number"
          inputMode="decimal"
          value={bodyWeight}
          onChange={(e) => setBodyWeight(e.target.value)}
          className="num"
        />
      </Field>

      <Field label="Training goal">
        <div className="grid grid-cols-3 gap-2">
          {TRAINING_GOALS.map((g) => (
            <Button
              key={g.id}
              variant={trainingGoal === g.id ? 'primary' : 'secondary'}
              onClick={() => setTrainingGoal(g.id)}
              className="!px-2"
            >
              {g.label}
            </Button>
          ))}
        </div>
      </Field>

      <button
        type="button"
        className="text-[12px] text-accent font-semibold mb-3"
        onClick={() => setAdvanced((v) => !v)}
      >
        {advanced ? 'Use auto macros' : 'Edit macros manually'}
      </button>

      {advanced && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Field label="Calories">
            <Input
              type="number"
              value={macros.kcal}
              onChange={(e) => setMacros({ ...macros, kcal: parseInt(e.target.value, 10) || 0 })}
              className="num"
            />
          </Field>
          <Field label="Protein (g)">
            <Input
              type="number"
              value={macros.protein_g}
              onChange={(e) =>
                setMacros({ ...macros, protein_g: parseInt(e.target.value, 10) || 0 })
              }
              className="num"
            />
          </Field>
          <Field label="Carbs (g)">
            <Input
              type="number"
              value={macros.carbs_g}
              onChange={(e) =>
                setMacros({ ...macros, carbs_g: parseInt(e.target.value, 10) || 0 })
              }
              className="num"
            />
          </Field>
          <Field label="Fat (g)">
            <Input
              type="number"
              value={macros.fat_g}
              onChange={(e) => setMacros({ ...macros, fat_g: parseInt(e.target.value, 10) || 0 })}
              className="num"
            />
          </Field>
        </div>
      )}

      {!advanced && (
        <p className="text-[12px] text-muted mb-3 num">
          {macros.kcal} kcal · {macros.protein_g}g P · {macros.carbs_g}g C · {macros.fat_g}g F
        </p>
      )}

      <Button variant="primary" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save goals'}
      </Button>
    </SurfaceCard>
  )
}
