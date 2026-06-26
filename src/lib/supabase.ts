import { createClient } from '@supabase/supabase-js'

// Project URL is public and safe to ship in the app bundle.
// Fetched from your linked Supabase project via MCP (get_project_url).
const DEFAULT_SUPABASE_URL = 'https://uqmwhmicwzpollunznks.supabase.co'

// Only the anon/publishable key needs to be in .env — it's also public (designed for browsers).
// MCP manages the database; env vars tell the React app how to reach it at runtime.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
