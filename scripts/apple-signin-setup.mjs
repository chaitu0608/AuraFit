#!/usr/bin/env node
/**
 * Apple Sign In setup reference for AuraFit native iOS + Supabase.
 * Run: node scripts/apple-signin-setup.mjs
 */

const SUPABASE_PROJECT = 'hhgxmupzodiiqgqifmaz'
const SUPABASE_URL = `https://${SUPABASE_PROJECT}.supabase.co`
const BUNDLE_ID = 'com.aurafit.app'

console.log(`
=== Apple Sign In setup for AuraFit ===

Your app uses Sign in with Apple on iPhone (not email magic links).
Configure BOTH Apple Developer and Supabase.

--- 1. Apple Developer (developer.apple.com) ---

A. App ID
   • Identifiers → App IDs → register ${BUNDLE_ID}
   • Enable: Sign in with Apple, HealthKit

B. Services ID (for Supabase web callback)
   • Identifiers → Services IDs → create e.g. com.aurafit.app.auth
   • Enable Sign in with Apple → Configure:
     - Primary App ID: ${BUNDLE_ID}
     - Domains: ${SUPABASE_PROJECT}.supabase.co
     - Return URL: ${SUPABASE_URL}/auth/v1/callback

C. Key for Sign in with Apple
   • Keys → create key with Sign in with Apple
   • Download .p8 file (once only) — note Key ID and Team ID

--- 2. Supabase Dashboard ---

Open: https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/auth/providers

Enable Apple provider:
  • Client ID (Services ID): com.aurafit.app.auth  (your Services ID)
  • Secret Key: paste contents of .p8 file
  • Key ID: from Apple
  • Team ID: from Apple Developer account

Redirect URL (already used in app):
  ${SUPABASE_URL}/auth/v1/callback

--- 3. App code (already set) ---

  capacitor.config.ts  → appId: ${BUNDLE_ID}
  src/lib/auth.ts      → redirectURI: ${SUPABASE_URL}/auth/v1/callback
  ios/App/App.entitlements → Sign in with Apple + HealthKit

--- 4. Free Apple ID note ---

Personal (free) signing CANNOT use HealthKit or Sign in with Apple.
App.entitlements is empty for free-team installs; use email OTP login instead.

To enable Apple + HealthKit later ($99/yr Apple Developer Program):
  1. Restore entitlements in ios/App/App/App.entitlements
  2. Set NATIVE_APPLE_SIGNIN_ENABLED = true in src/lib/auth.ts
  3. Re-run npm run ios:deploy

--- 5. After config ---

  npm run ios:deploy
  Xcode → Run on iPhone → tap "Continue with Apple"

`)
