import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { MealSlot, ParsedFoodItem } from '@/lib/food'

export interface ParseFoodResult {
  items: ParsedFoodItem[]
  meal_slot: MealSlot
}

export type ParseFoodErrorKind =
  | 'not_deployed'
  | 'missing_secret'
  | 'invalid_key'
  | 'quota'
  | 'auth'
  | 'unknown'

export class ParseFoodError extends Error {
  kind: ParseFoodErrorKind
  constructor(message: string, kind: ParseFoodErrorKind = 'unknown') {
    super(message)
    this.name = 'ParseFoodError'
    this.kind = kind
  }
}

const DASHBOARD_SECRETS =
  'https://supabase.com/dashboard/project/hhgxmupzodiiqgqifmaz/functions/secrets'

export function parseFoodHelpUrl(kind: ParseFoodErrorKind) {
  if (kind === 'not_deployed') {
    return 'https://supabase.com/dashboard/project/hhgxmupzodiiqgqifmaz/functions'
  }
  if (kind === 'invalid_key' || kind === 'quota') {
    return 'https://platform.openai.com/api-keys'
  }
  return DASHBOARD_SECRETS
}

function classifyServerError(message: string): ParseFoodError {
  const lower = message.toLowerCase()

  if (lower.includes('openai_api_key not configured')) {
    return new ParseFoodError(
      'OPENAI_API_KEY is not set in Supabase → Functions → Secrets.',
      'missing_secret',
    )
  }
  if (lower.includes('incorrect api key') || lower.includes('invalid_api_key') || lower.includes('401')) {
    return new ParseFoodError(
      'OpenAI rejected the API key. Ask your friend for a fresh key, then update Supabase Secrets.',
      'invalid_key',
    )
  }
  if (lower.includes('quota') || lower.includes('billing') || lower.includes('429')) {
    return new ParseFoodError(
      'OpenAI quota or billing limit hit on that API key.',
      'quota',
    )
  }
  if (lower.includes('openai error')) {
    return new ParseFoodError(message.replace(/^OpenAI error:\s*/i, 'OpenAI: '), 'unknown')
  }

  return new ParseFoodError(message, 'unknown')
}

export async function parseFoodText(
  text: string,
  mealSlot: MealSlot,
  locale = 'en-IN',
): Promise<ParseFoodResult> {
  if (!isSupabaseConfigured) {
    throw new ParseFoodError(
      'Supabase is not configured. Add VITE_SUPABASE_ANON_KEY to .env',
      'unknown',
    )
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) {
    throw new ParseFoodError('Sign in again to use food AI.', 'auth')
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-food`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, meal_slot: mealSlot, locale }),
  })

  const body = (await res.json().catch(() => ({}))) as ParseFoodResult & { error?: string }

  if (res.status === 404) {
    throw new ParseFoodError(
      'Food AI is not deployed yet. Run npm run deploy-edge-function.',
      'not_deployed',
    )
  }
  if (res.status === 401) {
    throw new ParseFoodError('Sign in again to use food AI.', 'auth')
  }
  if (!res.ok) {
    const serverMsg = body.error || `Food AI failed (HTTP ${res.status})`
    throw classifyServerError(serverMsg)
  }

  if (!body?.items?.length) {
    throw new ParseFoodError('No food items detected', 'unknown')
  }

  return body
}
