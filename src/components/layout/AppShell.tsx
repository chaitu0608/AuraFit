import { type ReactNode } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Dumbbell, UtensilsCrossed, Users2, User, ChevronLeft, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { key } from '@/lib/utils'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/workouts', icon: Dumbbell, label: 'Train' },
  { to: '/food', icon: UtensilsCrossed, label: 'Food' },
  { to: '/feed', icon: Users2, label: 'Social' },
  { to: '/profile', icon: User, label: 'You' },
] as const

const hideFab = ['/day/', '/workouts/', '/onboarding']

export function AppShell({
  title,
  subtitle,
  showBack,
  onBack,
  children,
  hideNav,
  fab,
}: {
  title?: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  children: ReactNode
  hideNav?: boolean
  fab?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const syncStatus = useUIStore((s) => s.syncStatus)
  const showFab =
    fab !== false &&
    !hideNav &&
    !hideFab.some((p) => location.pathname.includes(p)) &&
    location.pathname !== '/profile'

  return (
    <div className="max-w-app mx-auto min-h-screen flex flex-col bg-bg relative">
      <header className="sticky top-0 z-20 glass border-b border-line px-5 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex items-center gap-3 min-h-[var(--header-h)]">
        {showBack ? (
          <button type="button" className="icon-btn" aria-label="Back" onClick={onBack || (() => navigate(-1))}>
            <ChevronLeft size={20} />
          </button>
        ) : (
          <div className="w-2" />
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-display text-[18px] font-semibold tracking-tight truncate">{title}</div>
          )}
          {subtitle && <div className="text-[12px] text-muted truncate">{subtitle}</div>}
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-faint',
            syncStatus === 'synced' && 'text-ok',
            (syncStatus === 'busy' || syncStatus === 'pending') && 'text-warn',
            (syncStatus === 'err' || syncStatus === 'auth') && 'text-danger',
          )}
          title="Sync status"
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full bg-faint',
              syncStatus === 'synced' && 'bg-ok',
              (syncStatus === 'busy' || syncStatus === 'pending') && 'bg-warn',
              (syncStatus === 'err' || syncStatus === 'auth') && 'bg-danger',
            )}
          />
        </div>
      </header>

      <main className={cn('flex-1 px-5 pt-4', hideNav ? 'pb-8' : 'pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+20px)]')}>
        {children}
      </main>

      {showFab && (
        <button
          type="button"
          className="fab"
          aria-label="Log today's workout"
          onClick={() => navigate(`/day/${key(new Date())}`)}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {!hideNav && (
        <nav
          className="glass-nav fixed left-0 right-0 bottom-0 z-20 flex items-stretch pb-[env(safe-area-inset-bottom)]"
          style={{ height: 'calc(var(--nav-h) + env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-app mx-auto w-full flex">
            {tabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold tracking-wide transition-colors min-w-0',
                    isActive ? 'text-accent' : 'text-faint',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'p-1 rounded-rs transition-colors',
                        isActive && 'bg-accent-dim',
                      )}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                    </div>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
