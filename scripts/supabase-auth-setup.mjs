#!/usr/bin/env node
/**
 * One-time Supabase Auth setup for AuraFit (email login on iPhone + web).
 * Run: npm run supabase-auth-setup
 */
const PROJECT = 'hhgxmupzodiiqgqifmaz'
const BASE = `https://supabase.com/dashboard/project/${PROJECT}`

console.log(`
=== AuraFit — Supabase email login setup ===

WHAT WAS WRONG
  • Magic Link template used {{ .ConfirmationURL }} only → email had a link, no code
  • Link redirected to localhost → broken on iPhone
  • "Confirm email" may have been ON → wrong email template
  • MCP was linked to old project (uqmwhmicwzpollunznks) — use project_ref=${PROJECT}

APP FIX (rebuild with npm run ios:deploy)
  • iPhone: email link opens AuraFit via com.chaitu.aurafit.app://auth/callback
  • You can tap the link OR enter a 6-digit code

--- DASHBOARD (do once, click Save on each page) ---

1. SMTP (required for real emails)
   ${BASE}/auth/smtp
   Enable Custom SMTP → Gmail: smtp.gmail.com:587 + app password

2. Redirect URL (required for iPhone link login)
   ${BASE}/auth/url-configuration
   Add to Redirect URLs:
     com.chaitu.aurafit.app://auth/callback
   Site URL can stay http://localhost:5173 for web dev
   SAVE

3. Email provider
   ${BASE}/auth/providers
   Email → ON
   Confirm email → OFF
   SAVE

4. Magic Link template
   ${BASE}/auth/templates → Magic Link
   Subject: Your AuraFit login code
   Body (paste, then SAVE):

<h2>Your AuraFit login code</h2>
<p>Your code is: <strong>{{ .Token }}</strong></p>
<p>On iPhone you can tap the sign-in link below, or enter the code in the app.</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to AuraFit</a></p>
<p>This expires in 1 hour.</p>

--- TEST ---

  npm run ios:deploy → Run in Xcode
  Send login code → tap link OR enter 6 digits

MCP: ensure ~/.cursor/mcp.json has:
  "url": "https://mcp.supabase.com/mcp?project_ref=${PROJECT}"
  Then restart Cursor.
`)
