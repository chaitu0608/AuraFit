#!/usr/bin/env node
/**
 * End-to-end verifier: email OTP login + parse-food AI.
 *
 * Usage:
 *   node scripts/verify-e2e.mjs send you@email.com
 *   node scripts/verify-e2e.mjs verify you@email.com 482914
 *   node scripts/verify-e2e.mjs parse
 *
 * Or one shot (after you have the code from email):
 *   E2E_EMAIL=you@email.com E2E_OTP=482914 node scripts/verify-e2e.mjs
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const SESSION_FILE = resolve(root, 'supabase/.temp/e2e-session.json')
const PROJECT_REF = 'hhgxmupzodiiqgqifmaz'

function loadEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) out[m[1].trim()] = m[2].trim()
  }
  return out
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`
const anonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!anonKey || anonKey === 'your-anon-key') {
  console.error('Set VITE_SUPABASE_ANON_KEY in .env first.')
  process.exit(1)
}

const supabase = createClient(url, anonKey)

function saveSession(session) {
  const dir = resolve(root, 'supabase/.temp')
  mkdirSync(dir, { recursive: true })
  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2))
}

async function loadSession() {
  if (!existsSync(SESSION_FILE)) return null
  const data = JSON.parse(readFileSync(SESSION_FILE, 'utf8'))
  if (data?.access_token) return data
  return null
}

async function cmdSend(email) {
  console.log(`\nSending OTP to ${email}...`)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (error) {
    console.error('✗ OTP send failed:', error.message)
    console.log('\nFix: npm run supabase-auth-setup')
    console.log('  • Email ON, Confirm email OFF')
    console.log('  • Magic Link template includes {{ .Token }}')
    process.exit(1)
  }
  console.log('✓ Code sent. Check inbox + spam.')
  console.log(`\nNext: node scripts/verify-e2e.mjs verify ${email} <6-digit-code>`)
}

async function cmdVerify(email, otp) {
  console.log(`\nVerifying OTP for ${email}...`)
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email',
  })
  if (error || !data.session) {
    console.error('✗ Verify failed:', error?.message ?? 'no session')
    process.exit(1)
  }
  saveSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user_id: data.user?.id,
    email,
  })
  console.log('✓ Logged in. Session saved.')
  console.log('\nNext: node scripts/verify-e2e.mjs parse')
}

async function cmdParse() {
  let token = process.env.E2E_ACCESS_TOKEN
  if (!token) {
    const session = await loadSession()
    token = session?.access_token
  }
  if (!token) {
    console.error('No session. Run verify step first or set E2E_ACCESS_TOKEN.')
    process.exit(1)
  }

  console.log('\nProbing parse-food: "i ate a bowl of dal"...')
  const res = await fetch(`${url}/functions/v1/parse-food`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: 'i ate a bowl of dal',
      meal_slot: 'lunch',
      locale: 'en-IN',
    }),
  })

  if (res.status === 404) {
    console.error('✗ parse-food not deployed. Run: npm run deploy-edge-function')
    process.exit(1)
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`✗ parse-food HTTP ${res.status}:`, body.error ?? body)
    if (String(body.error).includes('OPENAI_API_KEY')) {
      console.log('\nAdd OPENAI_API_KEY in Dashboard → Edge Functions → Secrets')
    }
    process.exit(1)
  }

  const items = body.items ?? []
  if (!items.length) {
    console.error('✗ No items returned')
    process.exit(1)
  }

  const totalKcal = items.reduce((s, i) => s + (i.kcal ?? 0), 0)
  const totalProtein = items.reduce((s, i) => s + (i.protein_g ?? 0), 0)

  console.log('✓ parse-food OK')
  for (const item of items) {
    console.log(
      `  • ${item.name}: ${item.qty} ${item.unit}, ~${item.grams}g, ${item.kcal} kcal, ${item.protein_g}g protein`,
    )
  }

  const kcalOk = totalKcal >= 150 && totalKcal <= 600
  const proteinOk = totalProtein >= 8
  if (kcalOk && proteinOk) {
    console.log(`\n✓ Macros look sensible (${totalKcal} kcal, ${totalProtein}g protein)`)
    console.log('\nManual check in app: Food tab → Confirm → Home rings update.\n')
    process.exit(0)
  }

  console.warn(`\n⚠ Macros outside expected range (${totalKcal} kcal, ${totalProtein}g protein)`)
  console.warn('  Expected roughly 200–400 kcal and >10g protein for dal bowl.')
  process.exit(0)
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2)
  const email = process.env.E2E_EMAIL || a
  const otp = process.env.E2E_OTP || b

  if (!cmd && email && otp) {
    await cmdVerify(email, otp)
    await cmdParse()
    return
  }

  switch (cmd) {
    case 'send':
      if (!a) {
        console.error('Usage: node scripts/verify-e2e.mjs send you@email.com')
        process.exit(1)
      }
      await cmdSend(a)
      break
    case 'verify':
      if (!a || !b) {
        console.error('Usage: node scripts/verify-e2e.mjs verify you@email.com 123456')
        process.exit(1)
      }
      await cmdVerify(a, b)
      break
    case 'parse':
      await cmdParse()
      break
    default:
      console.log(`
AuraFit end-to-end verifier

  node scripts/verify-e2e.mjs send you@email.com
  node scripts/verify-e2e.mjs verify you@email.com 482914
  node scripts/verify-e2e.mjs parse

Or: E2E_EMAIL=... E2E_OTP=... node scripts/verify-e2e.mjs
`)
      process.exit(cmd ? 1 : 0)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
