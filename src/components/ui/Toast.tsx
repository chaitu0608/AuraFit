import { useEffect, useRef } from 'react'
import anime from 'animejs'
import { useUIStore } from '@/stores/uiStore'

export type ToastKind = 'info' | 'success' | 'error'

export function showToast(message: string, kind: ToastKind = 'info') {
  useUIStore.getState().showToast(message, kind)
}

export function ToastHost() {
  const toast = useUIStore((s) => s.toast)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!toast || !ref.current) return
    const el = ref.current
    anime.set(el, { opacity: 0, translateY: 24 })
    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 320,
      easing: 'easeOutCubic',
    })
    const t = setTimeout(() => {
      anime({
        targets: el,
        opacity: [1, 0],
        translateY: [0, 12],
        duration: 280,
        easing: 'easeInCubic',
        complete: () => useUIStore.getState().clearToast(),
      })
    }, 3200)
    return () => clearTimeout(t)
  }, [toast])

  if (!toast) return null

  const kindClass =
    toast.kind === 'error'
      ? 'border-danger/40 bg-danger/15 text-danger'
      : toast.kind === 'success'
        ? 'border-ok/40 bg-ok/15 text-ok'
        : 'border-line bg-surface2 text-text'

  return (
    <div
      className="fixed left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'calc(var(--nav-h) + env(safe-area-inset-bottom) + 12px)' }}
    >
      <div
        ref={ref}
        role="status"
        className={`max-w-app w-full rounded-full border px-4 py-3 text-center text-[13px] font-medium shadow-glow-sm pointer-events-auto ${kindClass}`}
      >
        {toast.message}
      </div>
    </div>
  )
}
