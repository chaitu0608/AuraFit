import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Card'
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
import { useFadeIn } from '@/components/anime/hooks'
import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import type { Profile } from '@/lib/types'

export function OnboardingPage() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [units, setUnits] = useState<'kg' | 'lb'>('kg')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const isNative = Capacitor.isNativePlatform()
  const showAppleSignIn = isNative && NATIVE_APPLE_SIGNIN_ENABLED
  const [step, setStep] = useState<'auth' | 'profile' | 'health'>('auth')
  const pageRef = useFadeIn<HTMLDivElement>([step, otpSent])

  useEffect(() => {
    if (session?.user && profile) navigate('/')
  }, [session, profile, navigate])

  useEffect(() => {
    if (session?.user && !profile) setStep('profile')
  }, [session, profile])

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
      setMessage('Enter the 6-digit code from your email.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not send code.')
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
      setStep('profile')
      setMessage('')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
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
    if (isNative && NATIVE_APPLE_SIGNIN_ENABLED) setStep('health')
    else navigate('/')
  }

  return (
    <div className="max-w-app mx-auto min-h-screen flex flex-col justify-center px-6 py-12 bg-bg">
      <div ref={pageRef}>
        {step === 'auth' && (
          <>
            <p className="text-accent text-sm font-semibold tracking-wider uppercase mb-2">{APP_NAME}</p>
            <h1 className="font-display text-[32px] font-bold tracking-tight mb-2">{APP_TAGLINE}</h1>
            <p className="text-muted mb-8">
              {isNative
                ? 'Log workouts and food with friends. Sign in with your email.'
                : 'Track PRs, train with friends, sync to Apple Health.'}
            </p>

            {showAppleSignIn && (
              <>
                <Button variant="primary" onClick={handleAppleSignIn} disabled={loading} className="mb-4">
                  Continue with Apple
                </Button>
                <p className="text-center text-[12px] text-faint mb-4">or</p>
              </>
            )}

            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                disabled={otpSent}
              />
            </Field>

            {!otpSent ? (
              <Button variant="primary" onClick={handleSendOtp} disabled={loading || !email.trim()}>
                {loading ? 'Sending…' : 'Send login code'}
              </Button>
            ) : (
              <>
                <Field label="6-digit code" hint="Check your inbox (and spam)">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    autoComplete="one-time-code"
                  />
                </Field>
                <Button variant="primary" onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
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
                <Button variant={units === 'kg' ? 'primary' : 'secondary'} onClick={() => setUnits('kg')}>
                  Kilograms
                </Button>
                <Button variant={units === 'lb' ? 'primary' : 'secondary'} onClick={() => setUnits('lb')}>
                  Pounds
                </Button>
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
          </>
        )}

        {message && <p className="text-sm text-muted mt-4 text-center">{message}</p>}
      </div>
    </div>
  )
}
