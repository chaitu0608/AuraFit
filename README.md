# AuraFit

**Your training, elevated.** — Personal workout tracker for iPhone. Log strength training, sync to Apple Health, train with friends.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind + anime.js
- **Native**: Capacitor 6 (iOS); email OTP login on free Personal Team (Apple Sign In / HealthKit need $99/yr program)
- **Backend**: Supabase (Postgres, Auth, Realtime)

## Quick start (web dev)

```bash
npm install
cp .env.example .env   # paste anon key only
npm run supabase-auth-setup   # one-time: configure email OTP in dashboard
npm run check-setup
npm run dev
```

**Login:** email + 6-digit code (not magic link). On iPhone (free Apple ID) use the same email OTP flow.

## Auth setup (one-time)

```bash
npm run supabase-auth-setup
```

In Supabase Dashboard:
1. **Auth → Providers → Email** — ON, **Confirm email** OFF
2. **Auth → Email Templates → Magic Link** — body must include `{{ .Token }}`

## AI food logging setup

1. Add `OPENAI_API_KEY` in [Edge Function Secrets](https://supabase.com/dashboard/project/hhgxmupzodiiqgqifmaz/functions/secrets) (never in `.env`)
2. Deploy the parser:

```bash
npx supabase login
npx supabase link --project-ref hhgxmupzodiiqgqifmaz
npm run deploy-edge-function
```

3. In app **Food** tab: type `i ate a bowl of dal` → Parse & log → Confirm

## Deploy to your iPhone (free Apple ID)

### Prerequisites

- Mac with Xcode installed
- iPhone 15 Pro connected via USB
- Free Apple ID signed into Xcode (Settings → Accounts)
- Supabase project with migrations applied (`supabase/migrations/`)

### Steps

1. **Add your anon key** (one line)

   ```bash
   cp .env.example .env
   # VITE_SUPABASE_ANON_KEY from Supabase Dashboard → Settings → API
   ```

   Project URL is already set: `https://hhgxmupzodiiqgqifmaz.supabase.co`

   **MCP vs .env:** Supabase MCP (in Cursor) is for *you* — migrations, SQL, debugging. The React app on your phone runs separately and needs the public anon key to call Supabase. That key is not secret; `.env` just keeps it out of git.

2. **Apply database migrations**

   Ask Cursor to run Supabase MCP `apply_migration` using `supabase/migrations/20250626000000_initial_schema.sql`, or paste that file into Dashboard → SQL Editor.

3. **Configure email OTP** — `npm run supabase-auth-setup` (Apple Sign In optional with paid developer account)

4. **Build and open Xcode**

   ```bash
   npm install
   npm run ios:ship-check   # preflight (USB iPhone, .env, CocoaPods)
   npm run ios:deploy
   ```

   If build fails with "iOS platform is not installed": Xcode → Settings → Components → install iOS support.

5. **In Xcode**
   - Select your iPhone as the run target
   - Signing & Capabilities → Team → your Apple ID
   - Do **not** add HealthKit or Sign in with Apple on free Personal Team
   - Press **Run** (▶)

6. **Trust developer on iPhone** — Settings → General → VPN & Device Management

7. **Re-sign every 7 days** (free provisioning limit)

   Re-run `npm run ios:deploy` and hit Run in Xcode.

## Friend onboarding

Your friend repeats the same steps on their Mac + iPhone:

1. Clone the repo
2. `npm install && npm run ios:deploy`
3. Sign in with their Apple ID in Xcode
4. Run to their device
5. Sign in with Apple in the app, pick a handle
6. Send each other a friend request from the **Friends** tab

## Features

| Tab | What it does |
|-----|-------------|
| Home | Calendar, macro rings, weekly stats |
| Train | Log workouts, sets/reps, templates |
| Food | AI food logging (`i ate a bowl of dal` → macros) |
| Social | Friend activity feed |
| You | Profile, settings |

- **HealthKit**: imports Apple Watch workouts, writes strength sessions to Fitness
- **Offline-first**: local Zustand cache + sync queue to Supabase
- **anime.js**: calendar stagger, PR confetti, animated stats

## Project structure

```
src/
  routes/          # Pages
  features/        # logging, healthkit, social
  lib/             # parsers, supabase, healthkit
  components/      # UI + anime hooks
  stores/          # zustand
supabase/migrations/
reference/index.html   # original single-file app
ios/                   # Capacitor iOS project (generated)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Web dev server |
| `npm run build` | Production build |
| `npm run ios:sync` | Build + sync to iOS |
| `npm run ios:deploy` | Build + sync + open Xcode |
| `npm run ios:ship-check` | Preflight before installing on iPhone |
| `npm run apple-signin-setup` | Print Apple Sign In + Supabase config steps |
| `npm run check-setup` | Verify Supabase, migrations, edge function |
| `npm run supabase-auth-setup` | Print email OTP dashboard steps |
| `npm run verify-e2e` | OTP login + parse-food probe (`send` / `verify` / `parse`) |

## Legacy app

The original single-file tracker is preserved at `reference/index.html`.
