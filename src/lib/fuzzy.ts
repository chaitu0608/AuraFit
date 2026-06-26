import { norm } from './utils'

export function lev(a: string, b: string): number {
  a = a.toLowerCase()
  b = b.toLowerCase()
  const m: number[][] = []
  for (let i = 0; i <= b.length; i++) m[i] = [i]
  for (let j = 0; j <= a.length; j++) m[0][j] = j
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] =
        b[i - 1] === a[j - 1]
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1], m[i][j - 1], m[i - 1][j]) + 1
  return m[b.length][a.length]
}

export function suggestName(name: string, allNames: string[]): string | null {
  const k = norm(name)
  if (k.length < 3) return null
  let best: string | null = null
  let bd = 99
  allNames.forEach((e) => {
    if (norm(e) === k) return
    const d = lev(k, norm(e))
    const thr = Math.max(2, Math.floor(norm(e).length * 0.34))
    if (d <= thr && d < bd) {
      bd = d
      best = e
    }
  })
  return best
}
