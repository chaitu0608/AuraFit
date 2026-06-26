import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/supabase'

/** Deep link target — must match Supabase Auth → URL Configuration → Redirect URLs */
export const AUTH_REDIRECT_URL = 'com.chaitu.aurafit.app://auth/callback'

function parseAuthParams(url: string): URLSearchParams {
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : ''
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : ''
  return new URLSearchParams(hash || query)
}

/** Handle magic-link redirect on native (tokens in URL hash or token_hash query). */
export async function handleAuthCallbackUrl(url: string): Promise<boolean> {
  if (!url.includes('auth/callback') && !url.includes('access_token') && !url.includes('token_hash')) {
    return false
  }

  const params = parseAuthParams(url)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    return !error
  }

  const token_hash = params.get('token_hash')
  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    })
    return !error
  }

  return false
}

/** Listen for iOS deep links when user taps the email sign-in link. */
export function initAuthDeepLink(): void {
  if (!Capacitor.isNativePlatform()) return

  void import('@capacitor/app').then(({ App }) => {
    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) void handleAuthCallbackUrl(launch.url)
    })

    void App.addListener('appUrlOpen', ({ url }) => {
      void handleAuthCallbackUrl(url)
    })
  })
}

export function getEmailRedirectTo(): string | undefined {
  if (Capacitor.isNativePlatform()) return AUTH_REDIRECT_URL
  return undefined
}
