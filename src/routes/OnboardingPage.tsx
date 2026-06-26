import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { signInWithApple, completeAppleSignIn } from '@/lib/auth'
import { initHealthKit } from '@/lib/healthkit'
import { useAuthStore } from '@/stores/authStore'
import { useFadeIn } from '@/components/anime/hooks'
import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import type { Profile } from '@/lib/types'

export function OnboardingPage() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [units, setUnits] = useState<'kg' | 'lb'>('kg')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const isNative = Capacitor.isNativePlatform()
  const [step, setStep] = useState<'auth' | 'profile' | 'health'>('auth')
  const pageRef = useFadeIn<HTMLDivElement>([step])

  useEffect(() => {
    if (session?.user && profile) navigate('/')
  }, [session, profile, navigate])

  async function handleAppleSignIn() {
    setLoading(true)
    try {
      const creds = await signInWithApple()
      if (creds?.identityToken) {
        await completeAppleSignIn(creds.identityToken)
        setStep('profile')
      }
    } catch {
      setMessage('Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSignIn() {
    if (!email.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    setMessage(error ? error.message : 'Check your email for the magic link.')
  }

  async function saveProfile() {
    if (!session?.user || !handle.trim()) return
    setLoading(true)
    const row: Partial<Profile> = {
      id: session.user.id,
      handle: handle.trim().toLowerCase(),
      display_name: session.user.user_metadata?.full_name || handle.trim(),
      units,
      share_workouts: true,
      auto_post_workout: true,
      auto_post_pr: true,
      auto_post_streak: true,
    }
    const { error } = await supabase.from('profiles').upsert(row)
    setLoading(false)
    if (error) {
      setMessage(error.message)
      return
    }
    useAuthStore.getState().setProfile(row as Profile)
    if (isNative) setStep('health')
    else navigate('/')
  }

  return (
    <div className="max-w-app mx-auto min-h-screen flex flex-col justify-center px-6 py-12 bg-bg">
      <div ref={pageRef}>
        {step === 'auth' && (
          <>
            <p className="text-accent text-sm font-semibold tracking-wider uppercase mb-2">{APP_NAME}</p>
            <h1 className="font-display text-[32px] font-bold tracking-tight mb-2">{APP_TAGLINE}</h1>
            <p className="text-muted mb-8">Track PRs, train with friends, sync to Apple Health.</p>
            {isNative ? (
              <Button variant="primary" onClick={handleAppleSignIn} disabled={loading}>
                Continue with Apple
              </Button>
            ) : (
              <>
                <Field label="Email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                </Field>
                <Button variant="primary" onClick={handleEmailSignIn} disabled={loading}>
                  Send magic link
                </Button>
              </>
            )}
          </>
        )}

        {step === 'profile' && (
          <>
            <h1 className="text-2xl font-bold mb-6">Create your profile</h1>
            <Field label="Username" hint="Friends will add you with this handle">
              <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="chaitu" />
            </Field>
            <Field label="Weight unit">
              <div className="grid grid-cols-2 gap-2">
                <Button variant={units === 'kg' ? 'primary' : 'secondary'} onClick={() => setUnits('kg')}>Kilograms</Button>
                <Button variant={units === 'lb' ? 'primary' : 'secondary'} onClick={() => setUnits('lb')}>Pounds</Button>
              </div>
            </Field>
            <Button variant="primary" onClick={saveProfile} disabled={!handle.trim() || loading}>
              Get started
            </Button>
          </>
        )}

        {step === 'health' && (
          <>
            <h1 className="text-2xl font-bold mb-2">Apple Health</h1>
            <p className="text-muted mb-8 text-sm">Import Watch workouts and write sessions to Fitness.</p>
            <Button variant="primary" onClick={async () => { await initHealthKit(); navigate('/') }} className="mb-3">
              Connect Health
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>Skip</Button>
          </>
        )}

        {message && <p className="text-sm text-muted mt-4 text-center">{message}</p>}
      </div>
    </div>
  )
}
