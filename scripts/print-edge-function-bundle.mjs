#!/usr/bin/env node
/**
 * Print dashboard deploy bundle for parse-food (fallback when CLI auth fails).
 * Run: node scripts/print-edge-function-bundle.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = 'hhgxmupzodiiqgqifmaz'
const fnUrl = `https://supabase.com/dashboard/project/${PROJECT_REF}/functions`

const index = readFileSync(resolve(root, 'supabase/functions/parse-food/index.ts'), 'utf8')
const cors = readFileSync(resolve(root, 'supabase/functions/_shared/cors.ts'), 'utf8')

console.log(`
=== Dashboard deploy fallback: parse-food ===

1. Secrets (required first):
   https://supabase.com/dashboard/project/${PROJECT_REF}/functions/secrets
   OPENAI_API_KEY, USDA_API_KEY (optional)

2. Create function:
   ${fnUrl}
   Name: parse-food
   Verify JWT: ON

3. Create file _shared/cors.ts with:
---BEGIN cors.ts---
${cors}
---END cors.ts---

4. Paste index.ts (imports ../_shared/cors.ts):
---BEGIN index.ts---
${index}
---END index.ts---

5. Deploy, then: npm run check-setup && npm run verify-e2e parse
`)
