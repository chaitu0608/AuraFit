import { create } from 'zustand'

interface UIState {
  syncStatus: 'local' | 'pending' | 'busy' | 'synced' | 'err' | 'auth'
  month: Date
  setSyncStatus: (status: UIState['syncStatus']) => void
  setMonth: (month: Date) => void
}

export const useUIStore = create<UIState>((set) => ({
  syncStatus: 'local',
  month: new Date(),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setMonth: (month) => set({ month }),
}))
