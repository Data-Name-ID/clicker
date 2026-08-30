import { useEffect } from 'react'
import { useGame } from '../store/context'
import type { Toast as ToastItem } from '../store/gameStore'

const TOAST_LIFETIME_MS = 4000

function ToastView({ toast }: { toast: ToastItem }) {
  const dismiss = useGame((s) => s.dismissToast)
  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), TOAST_LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [dismiss, toast.id])

  return (
    <div className={`toast toast--${toast.kind}`} role="status" onClick={() => dismiss(toast.id)}>
      <b className="toast__title">{toast.title}</b>
      {toast.text && <span className="toast__text">{toast.text}</span>}
    </div>
  )
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <ToastView key={t.id} toast={t} />
      ))}
    </div>
  )
}
