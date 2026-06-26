import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsResponse, errorResponse, jsonResponse } from "../_shared/cors.ts"

type MealSlot = "breakfast" | "lunch" | "dinner" | "snack"

interface ParseRequest {
  text: string
  meal_slot?: MealSlot
  locale?: string
}

interface ParsedItem {
  name: string
  qty: number
  unit: string
  est_grams: number
  cuisine_hint?: string
  kcal?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
}

interface ParseResponseItem {
  food_id: string | null
  name: string
  qty: number
  unit: string
  grams: number
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  confidence: number
}

/** Grams per common unit when food-specific serving is unknown */
const UNIT_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  ml: 1,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  piece: 50,
  pieces: 50,
  slice: 30,
  slices: 30,
  roti: 40,
  rotis: 40,
  serving: 100,
  bowl: 300,
}

const PARSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          qty: { type: "number" },
          unit: { type: "string" },
          est_grams: { type: "number" },
          cuisine_hint: { type: "string" },
          kcal: { type: "number" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
        },
        required: ["name", "qty", "unit", "est_grams"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
}

function gramsForUnit(qty: number, unit: string, estGrams: number): number {
  const key = unit.toLowerCase().trim()
  if (key === "g" || key === "gram" || key === "grams") return qty
  const perUnit = UNIT_GRAMS[key]
  if (perUnit) return Math.round(qty * perUnit)
  return Math.round(estGrams > 0 ? estGrams : qty * 100)
}

function scaleMacros(
  per100g: { kcal: number; protein_g: number; carbs_g: number; fat_g: number },
  grams: number,
) {
  const factor = grams / 100
  return {
    kcal: Math.round(per100g.kcal * factor),
    protein_g: Math.round(per100g.protein_g * factor * 10) / 10,
    carbs_g: Math.round(per100g.carbs_g * factor * 10) / 10,
    fat_g: Math.round(per100g.fat_g * factor * 10) / 10,
  }
}

async function parseWithOpenAI(text: string, locale?: string): Promise<ParsedItem[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY")
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured")

  const systemPrompt =
    locale === "en-IN"
      ? `You parse Indian meal descriptions into structured food items. Use common Indian food names (dal, roti, sabzi, idli, dosa, rice, paneer, etc.). Estimate realistic grams per serving. Also estimate kcal, protein_g, carbs_g, fat_g per item as fallback nutrition.`
      : `You parse meal descriptions into structured food items with realistic serving sizes. Estimate grams and fallback macros per item.`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "food_parse",
          strict: true,
          schema: PARSE_SCHEMA,
        },
      },
      temperature: 0.2,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI error: ${res.status} ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("No parse result from OpenAI")

  const parsed = JSON.parse(content) as { items: ParsedItem[] }
  return parsed.items
}

interface UsdaFood {
  fdcId: number
  description: string
  brandName?: string
  foodNutrients?: Array<{ nutrientId: number; value: number }>
}

function extractNutrients(nutrients: Array<{ nutrientId: number; value: number }> | undefined) {
  const find = (id: number) => nutrients?.find((n) => n.nutrientId === id)?.value ?? 0
  return {
    kcal: find(1008),
    protein_g: find(1003),
    carbs_g: find(1005),
    fat_g: find(1004),
    fiber_g: find(1079),
    sugar_g: find(2000),
  }
}

async function lookupUSDA(name: string): Promise<{
  source_id: string
  name: string
  brand: string | null
  per100g: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; sugar_g: number }
} | null> {
  const apiKey = Deno.env.get("USDA_API_KEY")
  if (!apiKey) return null

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search")
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("query", name)
  url.searchParams.set("pageSize", "3")
  url.searchParams.set("dataType", "Foundation,SR Legacy")

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = await res.json()
  const foods = (data.foods ?? []) as UsdaFood[]
  if (!foods.length) return null

  const top = foods[0]
  const nutrients = extractNutrients(top.foodNutrients)

  return {
    source_id: String(top.fdcId),
    name: top.description,
    brand: top.brandName ?? null,
    per100g: nutrients,
  }
}

async function cacheFood(
  supabase: ReturnType<typeof createClient>,
  source: "usda" | "ai",
  sourceId: string | null,
  name: string,
  brand: string | null,
  per100g: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g?: number; sugar_g?: number },
  ownerId: string | null,
): Promise<string | null> {
  const row = {
    source,
    source_id: sourceId,
    name,
    brand,
    serving_qty: 100,
    serving_unit: "g",
    serving_grams: 100,
    kcal: per100g.kcal,
    protein_g: per100g.protein_g,
    carbs_g: per100g.carbs_g,
    fat_g: per100g.fat_g,
    fiber_g: per100g.fiber_g ?? null,
    sugar_g: per100g.sugar_g ?? null,
    owner_id: ownerId,
  }

  if (sourceId) {
    const { data: existing } = await supabase
      .from("foods")
      .select("id")
      .eq("source", source)
      .eq("source_id", sourceId)
      .maybeSingle()
    if (existing) return existing.id
  }

  const { data, error } = await supabase.from("foods").insert(row).select("id").single()
  if (error) {
    if (sourceId) {
      const { data: retry } = await supabase
        .from("foods")
        .select("id")
        .eq("source", source)
        .eq("source_id", sourceId)
        .maybeSingle()
      return retry?.id ?? null
    }
    return null
  }
  return data?.id ?? null
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse()
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return errorResponse("Missing authorization", 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse("Unauthorized", 401)

    const body = (await req.json()) as ParseRequest
    if (!body.text?.trim()) return errorResponse("text is required")

    const items = await parseWithOpenAI(body.text.trim(), body.locale)
    const results: ParseResponseItem[] = []

    for (const item of items) {
      const grams = gramsForUnit(item.qty, item.unit, item.est_grams)
      const usda = await lookupUSDA(item.name)

      if (usda) {
        const macros = scaleMacros(usda.per100g, grams)
        const foodId = await cacheFood(
          supabase,
          "usda",
          usda.source_id,
          usda.name,
          usda.brand,
          usda.per100g,
          null,
        )
        results.push({
          food_id: foodId,
          name: usda.name,
          qty: item.qty,
          unit: item.unit,
          grams,
          ...macros,
          confidence: 0.85,
        })
      } else {
        const per100g = {
          kcal: item.kcal ?? 100,
          protein_g: item.protein_g ?? 5,
          carbs_g: item.carbs_g ?? 15,
          fat_g: item.fat_g ?? 3,
        }
        const macros = scaleMacros(per100g, grams)
        const foodId = await cacheFood(
          supabase,
          "ai",
          null,
          item.name,
          null,
          per100g,
          user.id,
        )
        results.push({
          food_id: foodId,
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          grams,
          ...macros,
          confidence: 0.45,
        })
      }
    }

    return jsonResponse({ items: results, meal_slot: body.meal_slot ?? "lunch" })
  } catch (e) {
    console.error(e)
    return errorResponse(e instanceof Error ? e.message : "Parse failed", 500)
  }
})
