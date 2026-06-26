import { Capacitor } from '@capacitor/core'

export async function signInWithApple(): Promise<{
  identityToken: string
  user?: string
} | null> {
  if (!Capacitor.isNativePlatform()) {
    // Dev fallback: email sign-in prompt
    const email = prompt('Dev mode: enter email for magic link sign-in')
    if (!email) return null
    const { supabase } = await import('./supabase')
    await supabase.auth.signInWithOtp({ email })
    alert('Check your email for the magic link.')
    return null
  }

  try {
    const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
    const result = await SignInWithApple.authorize({
      clientId: 'com.aurafit.app',
      redirectURI: 'https://uqmwhmicwzpollunznks.supabase.co/auth/v1/callback',
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
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
  })
  if (error) throw error
  return data
}
