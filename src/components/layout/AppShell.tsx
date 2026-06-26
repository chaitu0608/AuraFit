import { type ReactNode } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Dumbbell, UtensilsCrossed, Users2, User, ChevronLeft, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { key } from '@/lib/utils'
import { hapticLight } from '@/lib/haptics'
import { useSyncPulse, useTapBurst } from '@/components/anime/hooks'
import { useEffect } from 'react'

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
  hero,
}: {
  title?: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  children: ReactNode
  hideNav?: boolean
  fab?: boolean
  hero?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const syncStatus = useUIStore((s) => s.syncStatus)
  const keyboardOpen = useUIStore((s) => s.keyboardOpen)
  const setKeyboardOpen = useUIStore((s) => s.setKeyboardOpen)
  const onTap = useTapBurst()
  const syncPulseRef = useSyncPulse<HTMLSpanElement>(
    syncStatus === 'busy' || syncStatus === 'pending',
  )

  const showFab =
    fab !== false &&
    !hideNav &&
    !keyboardOpen &&
    !hideFab.some((p) => location.pathname.includes(p)) &&
    location.pathname !== '/profile'

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      const keyboard = window.innerHeight - vv.height > 120
      setKeyboardOpen(keyboard)
    }
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    return () => {
      vv.removeEventListener('resize', onResize)
      vv.removeEventListener('scroll', onResize)
    }
  }, [setKeyboardOpen])

  return (
    <div className={cn('max-w-app mx-auto min-h-screen flex flex-col bg-bg relative', hero && 'hero-gradient')}>
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
            <div className="font-display text-[18px] font-bold tracking-tight truncate">{title}</div>
          )}
          {subtitle && <div className="text-[12px] text-muted truncate">{subtitle}</div>}
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-faint',
            syncStatus === 'synced' && 'text-ok',
            (syncStatus === 'busy' || syncStatus === 'pending') && 'text-warn',
            (syncStatus === 'err' || syncStatus === 'auth') && 'text-danger',
          )}
          title="Sync status"
        >
          <span
            ref={syncPulseRef}
            className={cn(
              'w-2 h-2 rounded-full bg-faint',
              syncStatus === 'synced' && 'bg-ok shadow-[0_0_8px_var(--ok)]',
              (syncStatus === 'busy' || syncStatus === 'pending') && 'bg-warn',
              (syncStatus === 'err' || syncStatus === 'auth') && 'bg-danger',
            )}
          />
        </div>
      </header>

      <main
        className={cn(
          'flex-1 px-5 pt-4',
          hideNav || keyboardOpen
            ? 'pb-8'
            : 'pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+28px)]',
        )}
      >
        {children}
      </main>

      {showFab && (
        <button
          type="button"
          className="fab active:scale-95 transition-transform"
          aria-label="Log today's workout"
          onPointerDown={onTap}
          onClick={() => {
            void hapticLight()
            navigate(`/day/${key(new Date())}`)
          }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {!hideNav && !keyboardOpen && (
        <nav className="floating-nav" aria-label="Main">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => void hapticLight()}
              className={({ isActive }) =>
                cn('floating-nav-item transition-transform', isActive ? 'text-accent' : 'text-faint')
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'p-2 rounded-rs transition-all duration-200',
                      isActive && 'bg-accent-dim shadow-glow-sm -translate-y-0.5',
                    )}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
