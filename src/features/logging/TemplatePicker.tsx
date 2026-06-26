import { useDataStore } from '@/stores/dataStore'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'
import { Dumbbell } from 'lucide-react'

interface Props {
  onPick: (exercises: string[], name: string) => void
  onClose: () => void
}

export function TemplatePicker({ onPick, onClose }: Props) {
  const templates = useDataStore((s) => s.templates)
  const [q, setQ] = useState('')
  const matches = templates.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <BottomSheet title="Choose a routine" onClose={onClose}>
      <Input
        placeholder="Search routines…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4"
      />
      {matches.length ? (
        matches.map((t) => (
          <button
            key={t.id}
            type="button"
            className="card-pro-interactive w-full flex items-center gap-3 p-4 mb-2 text-left"
            onClick={() => onPick(t.exercises, t.name)}
          >
            <div className="w-10 h-10 rounded-rs bg-accent-dim flex items-center justify-center text-accent">
              <Dumbbell size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-muted truncate">
                {t.exercises.join(' · ') || 'No exercises'}
              </div>
            </div>
            <span className="num text-sm text-faint">{t.exercises.length}</span>
          </button>
        ))
      ) : (
        <p className="text-center text-muted py-8 text-sm">No routines yet. Create one under Train.</p>
      )}
    </BottomSheet>
  )
}
