import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, Template } from '@/lib/types'

interface OfflineQueueItem {
  id: string
  type: 'session' | 'template' | 'profile'
  action: 'upsert' | 'delete'
  payload: unknown
  createdAt: string
}

interface DataState {
  sessions: Record<string, Session>
  templates: Template[]
  queue: OfflineQueueItem[]
  setSessions: (sessions: Record<string, Session>) => void
  upsertSession: (key: string, session: Session) => void
  deleteSession: (key: string) => void
  setTemplates: (templates: Template[]) => void
  upsertTemplate: (template: Template) => void
  deleteTemplate: (id: string) => void
  enqueue: (item: Omit<OfflineQueueItem, 'id' | 'createdAt'>) => void
  dequeue: (id: string) => void
  clearQueue: () => void
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      sessions: {},
      templates: [],
      queue: [],
      setSessions: (sessions) => set({ sessions }),
      upsertSession: (key, session) =>
        set({ sessions: { ...get().sessions, [key]: session } }),
      deleteSession: (key) => {
        const next = { ...get().sessions }
        delete next[key]
        set({ sessions: next })
      },
      setTemplates: (templates) => set({ templates }),
      upsertTemplate: (template) => {
        const list = [...get().templates]
        const idx = list.findIndex((t) => t.id === template.id)
        if (idx >= 0) list[idx] = template
        else list.push(template)
        set({ templates: list })
      },
      deleteTemplate: (id) =>
        set({ templates: get().templates.filter((t) => t.id !== id) }),
      enqueue: (item) =>
        set({
          queue: [
            ...get().queue,
            {
              ...item,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      dequeue: (id) => set({ queue: get().queue.filter((q) => q.id !== id) }),
      clearQueue: () => set({ queue: [] }),
    }),
    { name: 'aurafit-data' },
  ),
)
