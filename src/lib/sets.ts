import type { DropSet, ResolvedSet, SetRow } from './types'

export function parseOne(s: string): { w: number | null; r: number | null } | null {
  s = String(s || '').trim()
  let m = s.match(/^([\d.]+)\s*(kg|lb|lbs)?\s*[x×*@]\s*(\d+)/i)
  if (m) return { w: parseFloat(m[1]), r: parseInt(m[3], 10) }
  const b = s.match(/^bw(?:\s*\+\s*([\d.]+))?\s*[x×*@]\s*(\d+)/i)
  if (b) return { w: b[1] ? parseFloat(b[1]) : null, r: parseInt(b[2], 10) }
  const kd = s.match(/^([\d.]+)\s*(kg|lb)?\s*-\s*(\d+)$/i)
  if (kd) return { w: parseFloat(kd[1]), r: parseInt(kd[3], 10) }
  const lone = s.match(/^(\d+)$/)
  if (lone) return { w: null, r: parseInt(lone[1], 10) }
  const xo = s.match(/^[x×]\s*(\d+)$/i)
  if (xo) return { w: null, r: parseInt(xo[1], 10) }
  return null
}

export function parseRaw(raw: string): {
  w: number | null
  r: number | null
  drop: DropSet | null
} {
  raw = String(raw || '').trim()
  if (!raw) return { w: null, r: null, drop: null }
  let main = raw
  let drop: DropSet | null = null
  const parts = raw.split(/\s+and\s+|\s+\/\s+|\s+then\s+/i)
  if (parts.length > 1) {
    main = parts[0]
    const dp = parseOne(parts[1])
    if (dp) drop = { w: dp.w == null ? null : dp.w, r: dp.r == null ? null : dp.r }
  }
  const mo = parseOne(main)
  return {
    w: mo?.w == null ? null : mo.w,
    r: mo?.r == null ? null : mo.r,
    drop,
  }
}

function nz(v: number | null | undefined): number | null {
  return v == null ? null : v
}

export function resolve(set: SetRow | null | undefined): ResolvedSet {
  if (!set) return { w: null, r: null, p: null, drop: null, assisted: false }
  if ('w' in set || 'r' in set || 'p' in set || 'weight_kg' in set || 'reps' in set || 'plates' in set) {
    return {
      w: nz(set.w ?? set.weight_kg ?? null),
      r: nz(set.r ?? set.reps ?? null),
      p: nz(set.p ?? set.plates ?? null),
      drop: set.drop || null,
      assisted: !!set.is_assisted,
    }
  }
  const pr = parseRaw(set.raw || '')
  return { w: pr.w, r: pr.r, p: null, drop: pr.drop, assisted: false }
}

export function newSet(): SetRow {
  return {}
}

export function isEmptySet(set: SetRow, type: string): boolean {
  const r = resolve(set)
  if (type === 'free') return r.r == null
  if (type === 'machine') return r.p == null && r.w == null && r.r == null
  return r.w == null && r.r == null
}
