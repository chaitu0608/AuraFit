# AuraFit

**Your training, elevated.** — Personal workout tracker for iPhone. Log strength training, sync to Apple Health, train with friends.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind + anime.js
- **Native**: Capacitor 6 (iOS) with HealthKit + Sign in with Apple
- **Backend**: Supabase (Postgres, Auth, Realtime)

## Quick start (web dev)

```bash
npm install
cp .env.example .env   # paste anon key only (URL is already in the app)
npm run dev
```

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

   Project URL is already set: `https://uqmwhmicwzpollunznks.supabase.co`

   **MCP vs .env:** Supabase MCP (in Cursor) is for *you* — migrations, SQL, debugging. The React app on your phone runs separately and needs the public anon key to call Supabase. That key is not secret; `.env` just keeps it out of git.

2. **Apply database migrations**

   Ask Cursor to run Supabase MCP `apply_migration` using `supabase/migrations/20250626000000_initial_schema.sql`, or paste that file into Dashboard → SQL Editor.

3. **Configure Apple Sign In** (Supabase Dashboard → Auth → Providers → Apple)

4. **Build and open Xcode**

   ```bash
   npm install
   npm run ios:deploy
   ```

5. **In Xcode**
   - Select your iPhone as the run target
   - Signing & Capabilities → Team → your Apple ID
   - Enable **HealthKit** and **Sign in with Apple** capabilities if prompted
   - Press **Run** (▶)

6. **Re-sign every 7 days** (free provisioning limit)

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
| Calendar | Monthly view, color-coded workout days |
| Workouts | Reusable templates |
| Feed | Friend activity, reactions, comments |
| Friends | Add by handle, accept requests, PR compare |
| Settings | Exercise manager, export, programs |

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

## Legacy app

The original single-file tracker is preserved at `reference/index.html`.
