import { type ReactNode } from 'react'

export function BottomSheet({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-app rounded-t-rxl border-t border-line2 bg-bg-elevated px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+24px)] max-h-[88vh] overflow-auto"
        data-stagger
      >
        <div className="w-9 h-1 rounded-full bg-line2 mx-auto mb-4" />
        <h3 className="text-lg font-semibold tracking-tight mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}
