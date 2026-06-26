import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Dumbbell } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { SectionHeader, Empty } from '@/components/ui/Card'
import { useDataStore } from '@/stores/dataStore'
import { usePersist } from '@/hooks/usePersist'
import { useStaggerIn } from '@/components/anime/hooks'

export function WorkoutsPage() {
  const navigate = useNavigate()
  const templates = useDataStore((s) => s.templates)
  const { persistTemplate } = usePersist()
  const listRef = useStaggerIn<HTMLDivElement>([templates.length])

  function createNew() {
    const t = { id: crypto.randomUUID(), name: '', exercises: [] as string[] }
    persistTemplate(t)
    navigate(`/workouts/${t.id}`)
  }

  return (
    <AppShell>
      <SectionHeader
        title="Train"
        subtitle="Routines & templates"
        action={
          <button type="button" className="icon-btn" onClick={createNew}>
            <Plus size={20} />
          </button>
        }
      />

      <div ref={listRef}>
        {templates.length ? (
          templates.map((t) => (
            <button
              key={t.id}
              type="button"
              data-stagger
              className="card-pro-interactive w-full flex items-center gap-3 p-4 mb-2 text-left"
              onClick={() => navigate(`/workouts/${t.id}`)}
            >
              <div className="w-11 h-11 rounded-rs bg-gradient-to-br from-accent-dim to-surface2 border border-line flex items-center justify-center text-accent">
                <Dumbbell size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[16px]">{t.name || 'Untitled'}</div>
                <div className="text-xs text-muted truncate mt-0.5">
                  {t.exercises.length ? t.exercises.join(' · ') : 'Add exercises'}
                </div>
              </div>
              <div className="flex items-center gap-2 text-faint">
                <span className="num text-sm">{t.exercises.length}</span>
                <ChevronRight size={18} />
              </div>
            </button>
          ))
        ) : (
          <Empty
            title="No routines yet"
            subtitle="Build a template or save a logged day as a routine."
            action={
              <Button variant="primary" onClick={createNew}>
                <Plus size={18} /> Create routine
              </Button>
            }
          />
        )}
      </div>

      {templates.length > 0 && (
        <Button variant="primary" className="mt-4" onClick={createNew}>
          <Plus size={18} /> New routine
        </Button>
      )}
    </AppShell>
  )
}
