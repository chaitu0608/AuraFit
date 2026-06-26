import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Dumbbell, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Card'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { supabase } from '@/lib/supabase'
import {
  sendEmailOtp,
  verifyEmailOtp,
  signInWithApple,
  completeAppleSignIn,
  NATIVE_APPLE_SIGNIN_ENABLED,
} from '@/lib/auth'
import { initHealthKit } from '@/lib/healthkit'
import { useAuthStore } from '@/stores/authStore'
import { usePageEnter, useEnter } from '@/components/anime/hooks'
import { showToast } from '@/components/ui/Toast'
import { hapticSuccess } from '@/lib/haptics'
import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import {
  TRAINING_GOALS,
  displayWeightToKg,
  macrosFromBody,
  persistNutritionGoals,
  type TrainingGoal,
} from '@/lib/goals'
import { useFoodStore } from '@/stores/foodStore'

import type { Profile } from '@/lib/types'

const steps = ['auth', 'profile', 'health'] as const

export function OnboardingPage() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [units, setUnits] = useState<'kg' | 'lb'>('kg')
  const [bodyWeight, setBodyWeight] = useState('70')
  const [trainingGoal, setTrainingGoal] = useState<TrainingGoal>('maintain')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const isNative = Capacitor.isNativePlatform()
  const showAppleSignIn = isNative && NATIVE_APPLE_SIGNIN_ENABLED
  const [step, setStep] = useState<'auth' | 'profile' | 'health'>('auth')
  const pageRef = usePageEnter<HTMLDivElement>([step, otpSent])
  const authStepRef = useEnter<HTMLDivElement>([step === 'auth' ? 'auth' : ''])
  const profileStepRef = useEnter<HTMLDivElement>([step === 'profile' ? 'profile' : ''])
  const healthStepRef = useEnter<HTMLDivElement>([step === 'health' ? 'health' : ''])

  useEffect(() => {
    if (otpSent && otp.length === 6 && !loading) {
      void handleVerifyOtp()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, otpSent])

  useEffect(() => {
    if (session?.user && profile) navigate('/')
  }, [session, profile, navigate])

  useEffect(() => {
    if (session?.user && !profile) setStep('profile')
  }, [session, profile])

  const stepIndex = steps.indexOf(step)

  async function handleAppleSignIn() {
    setLoading(true)
    setMessage('')
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

  async function handleSendOtp() {
    if (!email.trim()) return
    setLoading(true)
    setMessage('')
    try {
      await sendEmailOtp(email)
      setOtpSent(true)
      setMessage(
        isNative
          ? 'Check email — tap the sign-in link or enter the 6-digit code.'
          : 'Enter the 6-digit code from your email.',
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send code.'
      setMessage(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (!email.trim() || !otp.trim()) return
    setLoading(true)
    setMessage('')
    try {
      await verifyEmailOtp(email, otp)
      await hapticSuccess()
      setStep('profile')
      setMessage('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid or expired code.'
      setMessage(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    if (!session?.user || !handle.trim()) return
    const weightNum = parseFloat(bodyWeight)
    if (!weightNum || weightNum <= 0) {
      setMessage('Enter your body weight.')
      return
    }
    setLoading(true)
    const weightKg = displayWeightToKg(weightNum, units)
    const macros = macrosFromBody(weightKg, trainingGoal)
    const row: Partial<Profile> = {
      id: session.user.id,
      handle: handle.trim().toLowerCase(),
      display_name: session.user.user_metadata?.full_name || handle.trim(),
      units,
      body_weight_kg: weightKg,
      training_goal: trainingGoal,
      share_workouts: true,
      auto_post_workout: true,
      auto_post_pr: true,
      auto_post_streak: true,
    }
    const { error } = await supabase.from('profiles').upsert(row)
    if (error) {
      setLoading(false)
      setMessage(error.message)
      return
    }
    try {
      await persistNutritionGoals(session.user.id, macros)
      useFoodStore.getState().setGoals(macros)
    } catch (e) {
      setLoading(false)
      setMessage(e instanceof Error ? e.message : 'Could not save goals.')
      return
    }
    setLoading(false)
    useAuthStore.getState().setProfile(row as Profile)
    await hapticSuccess()
    if (isNative && NATIVE_APPLE_SIGNIN_ENABLED) setStep('health')
    else navigate('/')
  }

  return (
    <div className="max-w-app mx-auto min-h-screen flex flex-col bg-bg hero-gradient relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div ref={pageRef} className="flex-1 flex flex-col justify-center px-6 py-12 relative z-10">
        <div className="flex items-center gap-2 mb-8">
          {steps.slice(0, 2).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-accent' : 'bg-surface3'
              }`}
            />
          ))}
        </div>

        {step === 'auth' && (
            <div ref={authStepRef} key="auth">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-r bg-accent flex items-center justify-center shadow-glow">
                  <Dumbbell size={24} className="text-accent-ink" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-accent text-xs font-bold tracking-widest uppercase">{APP_NAME}</p>
                  <h1 className="font-display text-[28px] font-extrabold tracking-tight leading-tight">
                    {APP_TAGLINE}
                  </h1>
                </div>
              </div>

              <SurfaceCard className="mb-4">
                <p className="text-[14px] text-muted mb-4">
                  Train hard. Log food in plain English. Share PRs with friends.
                </p>

                {showAppleSignIn && (
                  <>
                    <Button variant="primary" onClick={handleAppleSignIn} disabled={loading} className="mb-3">
                      Continue with Apple
                    </Button>
                    <p className="text-center text-[12px] text-faint mb-3">or</p>
                  </>
                )}

                <Field label="Email">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      disabled={otpSent}
                      className="!pl-10"
                    />
                  </div>
                </Field>

                {!otpSent ? (
                  <Button variant="primary" onClick={handleSendOtp} disabled={loading || !email.trim()} className="mt-3">
                    {loading ? 'Sending…' : 'Send login code'}
                  </Button>
                ) : (
                  <>
                    <Field label="6-digit code" hint="Inbox + spam">
                      <Input
                        type="text"
                        inputMode="numeric"
                        enterKeyHint="go"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        autoComplete="one-time-code"
                        className="text-center text-[22px] font-bold tracking-[0.3em] num"
                      />
                    </Field>
                    <Button
                      variant="primary"
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length < 6}
                      className="mt-3 gap-2"
                    >
                      <Sparkles size={16} />
                      {loading ? 'Verifying…' : 'Verify & continue'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="mt-2 w-full"
                      onClick={() => {
                        setOtpSent(false)
                        setOtp('')
                        setMessage('')
                      }}
                    >
                      Use a different email
                    </Button>
                  </>
                )}
              </SurfaceCard>
            </div>
          )}

          {step === 'profile' && (
            <div ref={profileStepRef} key="profile">
              <h1 className="font-display text-[26px] font-extrabold mb-2">Almost there</h1>
              <p className="text-muted text-[14px] mb-6">Set your handle and targets — we&apos;ll personalize your scoreboard.</p>
              <SurfaceCard>
                <Field label="Username" hint="Friends add you with this handle">
                  <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="chaitu" />
                </Field>
                <Field label="Weight unit">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={units === 'kg' ? 'primary' : 'secondary'} onClick={() => setUnits('kg')}>
                      kg
                    </Button>
                    <Button variant={units === 'lb' ? 'primary' : 'secondary'} onClick={() => setUnits('lb')}>
                      lb
                    </Button>
                  </div>
                </Field>
                <Field label={`Body weight (${units})`}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                    className="num"
                  />
                </Field>
                <Field label="Goal">
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
                <p className="text-[11px] text-faint mt-2">
                  Targets: {macrosFromBody(displayWeightToKg(parseFloat(bodyWeight) || 70, units), trainingGoal).kcal} kcal ·{' '}
                  {macrosFromBody(displayWeightToKg(parseFloat(bodyWeight) || 70, units), trainingGoal).protein_g}g protein
                </p>
                <Button variant="primary" onClick={saveProfile} disabled={!handle.trim() || loading} className="mt-2">
                  Get started
                </Button>
              </SurfaceCard>
            </div>
          )}

          {step === 'health' && (
            <div ref={healthStepRef} key="health">
              <h1 className="text-2xl font-bold mb-2">Apple Health</h1>
              <p className="text-muted mb-6 text-sm">Import Watch workouts and write sessions to Fitness.</p>
              <Button
                variant="primary"
                onClick={async () => {
                  await initHealthKit()
                  navigate('/')
                }}
                className="mb-3"
              >
                Connect Health
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')}>
                Skip
              </Button>
            </div>
          )}

        {message && (
          <p className="text-sm text-muted mt-4 text-center px-4">{message}</p>
        )}
      </div>
    </div>
  )
}
