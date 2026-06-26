#!/usr/bin/env node
/**
 * Verifies AuraFit setup. Run: node scripts/check-setup.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

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
const url = env.VITE_SUPABASE_URL || 'https://uqmwhmicwzpollunznks.supabase.co'
const migrationPath = resolve(root, 'supabase/migrations/20250626000000_initial_schema.sql')

console.log('\n=== AuraFit setup check ===\n')

const checks = []

checks.push({
  name: '.env file',
  ok: existsSync(resolve(root, '.env')),
  action: 'cp .env.example .env',
})

checks.push({
  name: 'VITE_SUPABASE_ANON_KEY',
  ok: Boolean(anonKey && anonKey !== 'your-anon-key'),
  action: 'Dashboard → Settings → API → anon public (or Supabase MCP get_publishable_keys)',
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

    const { error } = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
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
      name: 'Database migration (profiles table)',
      ok: !error,
      action: error
        ? 'Run supabase/migrations/20250626000000_initial_schema.sql (Dashboard SQL or MCP apply_migration)'
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
  name: 'Migration file in repo',
  ok: existsSync(migrationPath),
  action: 'Missing supabase/migrations/',
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

console.log('\n--- What you need (summary) ---\n')
console.log('  REQUIRED for cloud sync + friends:')
console.log('    • VITE_SUPABASE_ANON_KEY  (one line in .env)')
console.log('    • Database migration applied once')
console.log('')
console.log('  REQUIRED for iPhone install:')
console.log('    • Mac + Xcode + free Apple ID (no paid key needed)')
console.log('')
console.log('  REQUIRED for Sign in with Apple (on device):')
console.log('    • Supabase Auth → Apple provider configured')
console.log('    • Apple Developer → Services ID + key (free account works)')
console.log('')
console.log('  NOT required:')
console.log('    • Service role key (never put in the app)')
console.log('    • Vercel / any other MCP')
console.log('    • HealthKit API keys (uses iOS permission prompt only)')
console.log('')

if (allOk) {
  console.log('All checks passed. Run: npm run dev  or  npm run ios:deploy\n')
  process.exit(0)
} else {
  console.log('Fix the items above, then re-run: node scripts/check-setup.mjs\n')
  process.exit(1)
}
