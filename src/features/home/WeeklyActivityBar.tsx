import { colorFor } from '@/lib/summarise'
import type { Session } from '@/lib/types'

export function WeeklyActivityBar({
  sessions,
  days,
}: {
  sessions: Record<string, Session>
  days: string[]
}) {
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return (
    <div className="flex justify-between gap-2 items-end h-16">
      {days.map((k) => {
        const s = sessions[k]
        const active = s && s.kind !== 'rest'
        const col = colorFor(s || null)
        return (
          <div key={k} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full max-w-[28px] rounded-md transition-all"
              style={{
                height: active ? 40 : 8,
                background: active && col ? col : 'var(--surface3)',
                opacity: active ? 0.9 : 0.5,
              }}
            />
            <span className="text-[10px] font-medium text-faint">{labels[new Date(k).getDay()]}</span>
          </div>
        )
      })}
    </div>
  )
}
