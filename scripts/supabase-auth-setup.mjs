#!/usr/bin/env node
/**
 * One-time Supabase Auth setup for email OTP login (AuraFit).
 * Run: node scripts/supabase-auth-setup.mjs
 */
const PROJECT = 'hhgxmupzodiiqgqifmaz'
const BASE = `https://supabase.com/dashboard/project/${PROJECT}`

console.log(`
=== AuraFit — Supabase email OTP setup ===

Do these ONCE in the Supabase Dashboard:

1. Email provider
   ${BASE}/auth/providers
   • Email → ON
   • "Confirm email" → OFF  (required for 6-digit code login)
   • Save

2. Email template (Magic Link)
   ${BASE}/auth/templates
   • Open "Magic Link"
   • Body must include:  {{ .Token }}
   • Example:

     Your AuraFit login code is: {{ .Token }}
     This code expires in 1 hour.

   • Save

3. Test on iPhone / web
   • Open AuraFit → enter email → Send login code
   • Check inbox + spam for 6-digit code
   • Enter code → Verify & continue

If you only get a clickable link (no 6-digit code), step 2 was not saved correctly.

Dashboard links:
  Auth providers: ${BASE}/auth/providers
  Email templates: ${BASE}/auth/templates
`)
