#!/usr/bin/env node
/**
 * Verifies AuraFit setup. Run: npm run check-setup
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const PROJECT_REF = 'hhgxmupzodiiqgqifmaz'

function loadEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) return {}
  const text = readFileSync(path, 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) out[m[1].trim()] = m[2].trim()
  }
  return out
}

const env = loadEnv()
const anonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const url = env.VITE_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`
const migrationPath = resolve(root, 'supabase/migrations/20250626000000_initial_schema.sql')
const foodMigrationPath = resolve(root, 'supabase/migrations/20260626000000_food_logging.sql')
const parseFoodFnPath = resolve(root, 'supabase/functions/parse-food/index.ts')

console.log('\n=== AuraFit setup check ===\n')

const checks = []

// Never allow OpenAI key in client bundle
const envText = existsSync(resolve(root, '.env')) ? readFileSync(resolve(root, '.env'), 'utf8') : ''
const hasOpenAiInEnv = /^(VITE_)?OPENAI_API_KEY\s*=/m.test(envText)
checks.push({
  name: 'OPENAI_API_KEY not in .env (use Supabase Secrets)',
  ok: !hasOpenAiInEnv,
  action: hasOpenAiInEnv
    ? 'Remove OPENAI_API_KEY from .env → Dashboard → Edge Functions → Secrets'
    : undefined,
})

checks.push({
  name: '.env file',
  ok: existsSync(resolve(root, '.env')),
  action: 'cp .env.example .env',
})

checks.push({
  name: 'VITE_SUPABASE_ANON_KEY',
  ok: Boolean(anonKey && anonKey !== 'your-anon-key'),
  action: 'Dashboard → Settings → API → anon public',
})

if (anonKey && anonKey !== 'your-anon-key') {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    })
    checks.push({
      name: 'Supabase API reachable',
      ok: res.status < 500,
      action: res.status >= 500 ? 'Check project URL / key' : undefined,
    })

    const profilesCheck = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    }).then(async (r) => {
      if (r.status === 404 || r.status === 406) {
        const body = await r.text()
        if (body.includes('relation') && body.includes('does not exist')) {
          return { error: 'profiles table missing' }
        }
      }
      return { error: r.ok ? null : `HTTP ${r.status}` }
    })

    checks.push({
      name: 'Database migration (profiles)',
      ok: !profilesCheck.error,
      action: profilesCheck.error
        ? 'Run supabase/migrations/20250626000000_initial_schema.sql in SQL Editor'
        : undefined,
    })

    const foodsCheck = await fetch(`${url}/rest/v1/foods?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    }).then(async (r) => {
      if (!r.ok) {
        const body = await r.text()
        if (body.includes('does not exist')) return { error: 'foods table missing' }
        return { error: `HTTP ${r.status}` }
      }
      return { error: null }
    })

    checks.push({
      name: 'Database migration (food logging)',
      ok: !foodsCheck.error,
      action: foodsCheck.error
        ? 'Run supabase/migrations/20260626000000_food_logging.sql in SQL Editor'
        : undefined,
    })

    const goalsColsCheck = await fetch(
      `${url}/rest/v1/profiles?select=body_weight_kg,training_goal&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    ).then(async (r) => {
      if (!r.ok) {
        const body = await r.text()
        if (body.includes('body_weight_kg') || body.includes('training_goal')) {
          return { error: 'profile goals columns missing' }
        }
        return { error: `HTTP ${r.status}` }
      }
      return { error: null }
    })

    checks.push({
      name: 'Database migration (profile goals)',
      ok: !goalsColsCheck.error,
      action: goalsColsCheck.error
        ? 'Run supabase/migrations/20260627000000_profile_goals.sql or npx supabase db push --linked'
        : undefined,
    })

    // parse-food edge function health (OPTIONS or POST without auth → should not be 404)
    const fnRes = await fetch(`${url}/functions/v1/parse-food`, {
      method: 'OPTIONS',
    })
    checks.push({
      name: 'parse-food edge function deployed',
      ok: fnRes.status !== 404,
      action: fnRes.status === 404
        ? 'npm run deploy-edge-function (after setting OPENAI_API_KEY in Secrets)'
        : undefined,
    })
  } catch (e) {
    checks.push({
      name: 'Supabase API reachable',
      ok: false,
      action: String(e),
    })
  }
}

checks.push({
  name: 'Migration files in repo',
  ok: existsSync(migrationPath) && existsSync(foodMigrationPath),
  action: 'Missing supabase/migrations/',
})

checks.push({
  name: 'parse-food source in repo',
  ok: existsSync(parseFoodFnPath),
  action: 'Missing supabase/functions/parse-food/',
})

checks.push({
  name: 'iOS project',
  ok: existsSync(resolve(root, 'ios/App/App.xcodeproj')),
  action: 'npm run ios:sync',
})

let allOk = true
for (const c of checks) {
  const icon = c.ok ? '✓' : '✗'
  console.log(`  ${icon} ${c.name}`)
  if (!c.ok) {
    allOk = false
    if (c.action) console.log(`      → ${c.action}`)
  }
}

console.log('\n--- Auth OTP (one-time dashboard setup) ---\n')
console.log('  Run: npm run supabase-auth-setup')
console.log(`  Or:  https://supabase.com/dashboard/project/${PROJECT_REF}/auth/providers`)
console.log('       Email ON, Confirm email OFF, template includes {{ .Token }}')
console.log('')

console.log('--- Secrets (server-side only) ---\n')
console.log(`  ${url.replace('.supabase.co', '')}.supabase.co → Functions → Secrets`)
console.log('  OPENAI_API_KEY (required for food AI)')
console.log('  USDA_API_KEY   (optional)')
console.log('')

if (allOk) {
  console.log('All checks passed.')
  console.log('  Web:  npm run dev')
  console.log('  iOS:  npm run ios:deploy\n')
  process.exit(0)
} else {
  console.log('Fix items above, then re-run: npm run check-setup\n')
  process.exit(1)
}
