#!/usr/bin/env node
/**
 * Pre-flight checks before shipping AuraFit to iPhone via Xcode.
 * Run: node scripts/ios-ship-check.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

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

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return null
  }
}

console.log('\n=== AuraFit iPhone ship check ===\n')

const checks = []

checks.push({
  name: 'Xcode installed',
  ok: Boolean(run('xcodebuild -version')),
  action: 'Install Xcode from the Mac App Store',
})

checks.push({
  name: 'Production build (dist/)',
  ok: existsSync(resolve(root, 'dist/index.html')),
  action: 'npm run ios:deploy',
})

checks.push({
  name: 'iOS synced (public bundle)',
  ok: existsSync(resolve(root, 'ios/App/App/public/index.html')),
  action: 'npm run ios:sync',
})

checks.push({
  name: 'CocoaPods',
  ok: Boolean(run('which pod')),
  action: 'brew install cocoapods && cd ios/App && pod install',
})

const env = loadEnv()
const anonKey = env.VITE_SUPABASE_ANON_KEY || ''
checks.push({
  name: '.env with Supabase anon key',
  ok: Boolean(anonKey && anonKey !== 'your-anon-key'),
  action: 'Set VITE_SUPABASE_ANON_KEY in .env then re-run npm run ios:deploy',
})

checks.push({
  name: 'iOS platform (device SDK)',
  ok: !/iOS .* is not installed/.test(run('xcodebuild -workspace ios/App/App.xcworkspace -scheme App -showdestinations 2>&1') || ''),
  action: 'Xcode → Settings → Components → install iOS platform support',
})

const devices = run('xcrun devicectl list devices 2>/dev/null') || ''
const iphoneConnected = /iPhone/i.test(devices) && !/unavailable/.test(devices.split('iPhone')[1]?.split('\n')[0] || 'unavailable')
checks.push({
  name: 'iPhone connected & available',
  ok: iphoneConnected,
  action: 'Connect iPhone via USB, unlock, tap Trust This Computer',
})

let allOk = true
for (const c of checks) {
  console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}`)
  if (!c.ok) {
    allOk = false
    if (c.action) console.log(`      → ${c.action}`)
  }
}

console.log('\n--- Xcode steps (manual) ---\n')
console.log('  1. Open: ios/App/App.xcworkspace')
console.log('  2. Target App → Signing & Capabilities → Team → your Apple ID')
console.log('  3. Bundle ID: com.aurafit.app (change if signing conflict)')
console.log('  4. Device dropdown → your iPhone → Run (▶)')
console.log('  5. On iPhone: Settings → General → VPN & Device Management → Trust')
console.log('\n--- Apple Sign In (Supabase) ---\n')
console.log('  Dashboard: https://supabase.com/dashboard/project/hhgxmupzodiiqgqifmaz/auth/providers')
console.log('  Enable Apple → see scripts/apple-signin-setup.mjs for full steps')
console.log('  Callback URL: https://hhgxmupzodiiqgqifmaz.supabase.co/auth/v1/callback')
console.log('  App bundle ID: com.aurafit.app')
console.log('')

if (allOk) {
  console.log('Ready to Run in Xcode.\n')
  process.exit(0)
} else {
  console.log('Fix items above, then: npm run ios:deploy\n')
  process.exit(1)
}
