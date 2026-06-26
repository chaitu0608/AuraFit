import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/supabase'
import { getEmailRedirectTo } from '@/lib/authDeepLink'

/** Free Personal Team cannot use Sign in with Apple — requires paid Apple Developer Program. */
export const NATIVE_APPLE_SIGNIN_ENABLED = false

export async function sendEmailOtp(email: string) {
  const redirectTo = getEmailRedirectTo()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
    },
  })
  if (error) throw error
}

export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  })
  if (error) throw error
  return data
}

export async function signInWithApple(): Promise<{
  identityToken: string
  user?: string
} | null> {
  if (!NATIVE_APPLE_SIGNIN_ENABLED || !Capacitor.isNativePlatform()) {
    return null
  }

  try {
    const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
    const result = await SignInWithApple.authorize({
      clientId: 'com.aurafit.app',
      redirectURI: 'https://hhgxmupzodiiqgqifmaz.supabase.co/auth/v1/callback',
      scopes: 'email name',
    })
    return {
      identityToken: result.response.identityToken,
      user: result.response.user ?? undefined,
    }
  } catch {
    return null
  }
}

export async function completeAppleSignIn(identityToken: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
  })
  if (error) throw error
  return data
}
