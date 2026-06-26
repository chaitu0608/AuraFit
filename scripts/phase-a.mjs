#!/usr/bin/env node
/**
 * Phase A orchestrator — auth + food AI readiness.
 * Run: npm run phase-a
 */
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = 'hhgxmupzodiiqgqifmaz'

function run(cmd, inherit = false) {
  return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: inherit ? 'inherit' : 'pipe' })
}

console.log('\n=== AuraFit Phase A: Auth + Food AI ===\n')

console.log('Step 1 — Email OTP (one-time dashboard)')
console.log('  npm run supabase-auth-setup\n')

console.log('Step 2 — Edge Function secrets')
console.log(`  https://supabase.com/dashboard/project/${PROJECT_REF}/functions/secrets`)
console.log('  OPENAI_API_KEY (required), USDA_API_KEY (optional)\n')

const hasToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN)
console.log('Step 3 — Deploy parse-food')
if (hasToken) {
  console.log('  SUPABASE_ACCESS_TOKEN detected — deploying...\n')
  try {
    run(`npx supabase login --token ${process.env.SUPABASE_ACCESS_TOKEN}`, true)
    run(`npx supabase link --project-ref ${PROJECT_REF}`, true)
    run(`npx supabase functions deploy parse-food --project-ref ${PROJECT_REF}`, true)
    console.log('\n✓ Deploy complete\n')
  } catch (e) {
    console.error('Deploy failed:', e.message)
    process.exit(1)
  }
} else {
  console.log('  Create token: https://supabase.com/dashboard/account/tokens')
  console.log('  Then: SUPABASE_ACCESS_TOKEN=sbp_... npm run phase-a')
  console.log('  Or:  npm run deploy-edge-function (after npx supabase login)\n')
}

console.log('Step 4 — Setup check')
try {
  run('node scripts/check-setup.mjs', true)
} catch {
  process.exit(1)
}

console.log('Step 5 — End-to-end verify')
console.log('  node scripts/verify-e2e.mjs send you@email.com')
console.log('  node scripts/verify-e2e.mjs verify you@email.com <code>')
console.log('  node scripts/verify-e2e.mjs parse\n')
