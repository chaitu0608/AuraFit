import { colorFor } from '@/lib/summarise'
import { sessionDayVolume } from '@/lib/stats'
import type { Session } from '@/lib/types'

export function WeeklyActivityBar({
  sessions,
  days,
}: {
  sessions: Record<string, Session>
  days: string[]
}) {
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const volumes = days.map((k) => {
    const s = sessions[k]
    return s && s.kind !== 'rest' ? sessionDayVolume(s) : 0
  })
  const maxVol = Math.max(...volumes, 1)

  return (
    <div className="flex justify-between gap-1.5 items-end h-[72px]">
      {days.map((k, i) => {
        const s = sessions[k]
        const active = s && s.kind !== 'rest'
        const vol = volumes[i]
        const height = active ? Math.max(10, Math.round((vol / maxVol) * 56)) : 8
        const col = colorFor(s || null)
        const label =
          active && s?.name
            ? s.name.slice(0, 12)
            : active && vol > 0
              ? `${vol}kg`
              : ''

        return (
          <div key={k} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div
              className="w-full max-w-[32px] rounded-md transition-all"
              style={{
                height,
                background: active && col ? col : 'var(--surface3)',
                opacity: active ? 0.95 : 0.45,
              }}
              title={label || undefined}
            />
            <span className="text-[10px] font-medium text-faint">
              {labels[new Date(k).getDay()]}
            </span>
            {label && (
              <span className="text-[8px] text-faint truncate w-full text-center leading-tight">
                {label}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
