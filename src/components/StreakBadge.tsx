import { useEffect, useRef } from 'react'
import { animateStreakFire } from '@/components/anime/hooks'
import { useDataStore } from '@/stores/dataStore'

export function StreakBadge() {
  const fireRef = useRef<HTMLSpanElement>(null)
  const sessions = useDataStore((s) => s.sessions)

  const streak = (() => {
    const keys = Object.keys(sessions)
      .filter((k) => sessions[k]?.kind !== 'rest')
      .sort()
      .reverse()
    let count = 0
    let prev: Date | null = null
    for (const k of keys) {
      const d = new Date(k)
      if (!prev) {
        count = 1
        prev = d
        continue
      }
      const diff = (prev.getTime() - d.getTime()) / 86400000
      if (diff === 1) {
        count++
        prev = d
      } else break
    }
    return count
  })()

  useEffect(() => {
    if (streak > 0 && fireRef.current) animateStreakFire(fireRef.current)
  }, [streak])

  if (streak < 1) return null

  return (
    <div className="inline-flex items-center gap-1.5 text-sm text-accent font-medium mb-3">
      <span ref={fireRef}>🔥</span>
      <span className="num">{streak} day streak</span>
    </div>
  )
}
