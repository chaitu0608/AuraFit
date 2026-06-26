import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  )
}

export function norm(s: unknown): string {
  return String(s == null ? '' : s)
    .trim()
    .toLowerCase()
}

export function numOrNull(v: string): number | null {
  const t = String(v).trim()
  if (t === '') return null
  const n = parseFloat(t)
  return isNaN(n) ? null : n
}

export function intOrNull(v: string): number | null {
  const t = String(v).trim()
  if (t === '') return null
  const n = parseInt(t, 10)
  return isNaN(n) ? null : n
}

export const LB = 0.45359237

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const MON = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

export function key(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

export function fromKey(k: string): Date {
  const a = k.split('-').map(Number)
  return new Date(a[0], a[1] - 1, a[2])
}

export function pretty(k: string): string {
  const d = fromKey(k)
  return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`
}

export function shortDate(k: string): string {
  const d = fromKey(k)
  return `${MON[d.getMonth()]} ${d.getDate()}`
}

export const todayKey = key(new Date())

export function fmtKg(x: number): string {
  return String(Math.round(x * 10) / 10)
}

export function est1rm(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}
