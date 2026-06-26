import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'aurafit-pwa-dismissed'

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY)) return
    if (isIOS()) {
      const t = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+12px)] left-4 right-4 z-30 max-w-app mx-auto">
      <div className="glass border border-line rounded-rx p-4 shadow-lg flex gap-3 items-start">
        <Download size={20} className="text-accent shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold mb-1">Install AuraFit</div>
          <p className="text-[12px] text-muted leading-relaxed">
            Tap Share, then &quot;Add to Home Screen&quot; for a full-screen app experience.
          </p>
        </div>
        <button
          type="button"
          className="icon-btn !w-8 !h-8 shrink-0"
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1')
            setVisible(false)
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
