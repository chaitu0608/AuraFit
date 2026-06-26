import { useCallback } from 'react'
import { useDataStore } from '@/stores/dataStore'
import { useUIStore } from '@/stores/uiStore'
import type { Session, Template } from '@/lib/types'

export function usePersist() {
  const upsertSession = useDataStore((s) => s.upsertSession)
  const deleteSession = useDataStore((s) => s.deleteSession)
  const upsertTemplate = useDataStore((s) => s.upsertTemplate)
  const deleteTemplate = useDataStore((s) => s.deleteTemplate)
  const enqueue = useDataStore((s) => s.enqueue)
  const setSyncStatus = useUIStore((s) => s.setSyncStatus)

  const persistSession = useCallback(
    (key: string, session: Session) => {
      if (!session.id) session.id = crypto.randomUUID()
      upsertSession(key, session)
      enqueue({ type: 'session', action: 'upsert', payload: session })
      setSyncStatus('pending')
    },
    [upsertSession, enqueue, setSyncStatus],
  )

  const removeSession = useCallback(
    (key: string) => {
      deleteSession(key)
      enqueue({
        type: 'session',
        action: 'delete',
        payload: { date: key },
      })
      setSyncStatus('pending')
    },
    [deleteSession, enqueue, setSyncStatus],
  )

  const persistTemplate = useCallback(
    (template: Template) => {
      if (!template.id) template.id = crypto.randomUUID()
      upsertTemplate(template)
      enqueue({ type: 'template', action: 'upsert', payload: template })
      setSyncStatus('pending')
    },
    [upsertTemplate, enqueue, setSyncStatus],
  )

  const removeTemplate = useCallback(
    (id: string) => {
      deleteTemplate(id)
      enqueue({ type: 'template', action: 'delete', payload: { id } })
      setSyncStatus('pending')
    },
    [deleteTemplate, enqueue, setSyncStatus],
  )

  return { persistSession, removeSession, persistTemplate, removeTemplate }
}
