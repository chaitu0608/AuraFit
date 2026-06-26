#!/usr/bin/env node
/**
 * Deploy parse-food edge function to Supabase.
 * Run: npm run deploy-edge-function
 */
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const PROJECT_REF = 'hhgxmupzodiiqgqifmaz'

const SECRETS_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/functions/secrets`
const FUNCTIONS_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/functions`
const TOKEN_URL = 'https://supabase.com/dashboard/account/tokens'

console.log('\n=== Deploy parse-food edge function ===\n')

console.log('BEFORE deploy — set secrets (server-side only, NOT in .env):')
console.log(`  ${SECRETS_URL}`)
console.log('  • OPENAI_API_KEY  (required)')
console.log('  • USDA_API_KEY    (optional, better macro accuracy)\n')

console.log('CLI auth (if not logged in):')
console.log(`  1. Create token: ${TOKEN_URL}`)
console.log('  2. npx supabase login')
console.log(`  3. npx supabase link --project-ref ${PROJECT_REF}\n`)

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: root })
}

try {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    console.log('Using SUPABASE_ACCESS_TOKEN from environment.\n')
  }
  run(`npx supabase functions deploy parse-food --project-ref ${PROJECT_REF}`)
  console.log('\n✓ Deployed parse-food successfully.')
  console.log('  Verify: npm run check-setup\n')
} catch {
  console.log(`
Deploy failed. Try manually:

  npx supabase login
  npx supabase link --project-ref ${PROJECT_REF}
  npx supabase functions deploy parse-food --project-ref ${PROJECT_REF}

Or paste code in Dashboard:
  ${FUNCTIONS_URL}
  • Create function "parse-food"
  • Paste supabase/functions/parse-food/index.ts
`)
  process.exit(1)
}
