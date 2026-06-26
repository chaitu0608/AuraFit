import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import type { Challenge, Program } from '@/lib/types'

export function ProgramsPage() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const templates = useDataStore((s) => s.templates)
  const [programs, setPrograms] = useState<Program[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [name, setName] = useState('')
  const [weeks, setWeeks] = useState(4)

  useEffect(() => {
    if (userId) load()
  }, [userId])

  async function load() {
    const { data: progs } = await supabase.from('programs').select('*')
    const { data: chals } = await supabase.from('challenges').select('*, challenge_participants(*)')
    setPrograms((progs as Program[]) || [])
    setChallenges((chals as Challenge[]) || [])
  }

  async function createProgram() {
    if (!name.trim() || !userId) return
    const { data } = await supabase
      .from('programs')
      .insert({ owner_id: userId, name: name.trim(), weeks })
      .select()
      .single()
    if (data) {
      for (let w = 1; w <= weeks; w++) {
        for (let d = 0; d < 7; d++) {
          await supabase.from('program_days').insert({
            program_id: data.id,
            week: w,
            dow: d,
            template_id: templates[0]?.id || null,
          })
        }
      }
      setName('')
      load()
    }
  }

  async function createChallenge() {
    if (!userId) return
    const ends = new Date()
    ends.setDate(ends.getDate() + 14)
    await supabase.from('challenges').insert({
      owner_id: userId,
      name: '14-day streak',
      kind: 'streak',
      target: 14,
      ends_at: ends.toISOString(),
    })
    load()
  }

  async function joinChallenge(challengeId: string) {
    if (!userId) return
    await supabase.from('challenge_participants').upsert({
      challenge_id: challengeId,
      user_id: userId,
      current_value: 0,
    })
    load()
  }

  return (
    <AppShell title="Programs" showBack onBack={() => navigate('/settings')}>
      <div className="eyebrow">Create program</div>
      <Field label="Program name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PPL 8 weeks" />
      </Field>
      <Field label="Weeks">
        <Input
          type="number"
          value={weeks}
          onChange={(e) => setWeeks(parseInt(e.target.value, 10) || 4)}
        />
      </Field>
      <Button variant="primary" onClick={createProgram} className="mb-6">
        Create program
      </Button>

      <div className="eyebrow">Your programs</div>
      {programs.map((p) => (
        <div key={p.id} className="card mb-2">
          <div className="font-semibold">{p.name}</div>
          <div className="text-sm text-muted">{p.weeks} weeks</div>
        </div>
      ))}

      <div className="eyebrow mt-6">Challenges</div>
      <Button variant="ghost" onClick={createChallenge} className="mb-3">
        + New streak challenge
      </Button>
      {challenges.map((c) => (
        <div key={c.id} className="card mb-2 flex justify-between items-center">
          <div>
            <div className="font-semibold">{c.name}</div>
            <div className="text-sm text-muted capitalize">{c.kind} · target {c.target}</div>
          </div>
          <Button size="sm" variant="primary" onClick={() => joinChallenge(c.id)}>
            Join
          </Button>
        </div>
      ))}
    </AppShell>
  )
}
