import { create } from 'zustand'

interface UIState {
  syncStatus: 'local' | 'pending' | 'busy' | 'synced' | 'err' | 'auth'
  month: Date
  keyboardOpen: boolean
  toast: { message: string; kind: 'info' | 'success' | 'error' } | null
  setSyncStatus: (status: UIState['syncStatus']) => void
  setMonth: (month: Date) => void
  setKeyboardOpen: (open: boolean) => void
  showToast: (message: string, kind?: 'info' | 'success' | 'error') => void
  clearToast: () => void
}

export const useUIStore = create<UIState>((set) => ({
  syncStatus: 'local',
  month: new Date(),
  keyboardOpen: false,
  toast: null,
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setMonth: (month) => set({ month }),
  setKeyboardOpen: (keyboardOpen) => set({ keyboardOpen }),
  showToast: (message, kind = 'info') => set({ toast: { message, kind } }),
  clearToast: () => set({ toast: null }),
}))
