import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useSyncEngine, useRemoteHydration } from '@/lib/sync'
import { OnboardingPage } from '@/routes/OnboardingPage'
import { CalendarPage } from '@/routes/CalendarPage'
import { DayPage } from '@/routes/DayPage'
import { WorkoutsPage } from '@/routes/WorkoutsPage'
import { WorkoutEditPage } from '@/routes/WorkoutEditPage'
import { SettingsPage } from '@/routes/SettingsPage'
import { ExerciseManagerPage } from '@/routes/ExerciseManagerPage'
import { FeedPage } from '@/routes/FeedPage'
import { FriendsPage } from '@/routes/FriendsPage'
import { ComparePage } from '@/routes/ComparePage'
import { ProfilePage } from '@/routes/ProfilePage'
import { ProgramsPage } from '@/routes/ProgramsPage'
import { FoodPage } from '@/routes/FoodPage'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function AppRoutes() {
  const { session, profile, loading, isLocalOnly } = useAuth()
  useSyncEngine()
  useRemoteHydration()

  if (loading) {
    return (
      <div className="max-w-app mx-auto min-h-screen flex items-center justify-center text-muted">
        Loading…
      </div>
    )
  }

  if (!isLocalOnly && !session) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    )
  }

  if (!isLocalOnly && !profile) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<CalendarPage />} />
      <Route path="/day/:dateKey" element={<DayPage />} />
      <Route path="/workouts" element={<WorkoutsPage />} />
      <Route path="/workouts/:id" element={<WorkoutEditPage />} />
      <Route path="/food" element={<FoodPage />} />
      <Route path="/food/:dateKey" element={<FoodPage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/friends" element={<FriendsPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/exercises" element={<ExerciseManagerPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/programs" element={<ProgramsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <datalist id="exlist" />
        <PWAInstallPrompt />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
