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

const MAX_VISIBLE_TOASTS = 3

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  const visible = toasts.slice(-MAX_VISIBLE_TOASTS)
  return (
    <div className="toasts" aria-live="polite">
      {toasts.length > MAX_VISIBLE_TOASTS && <div className="toasts__more">…ещё {toasts.length - MAX_VISIBLE_TOASTS}</div>}
      {visible.map((t) => (
        <ToastView key={t.id} toast={t} />
      ))}
    </div>
  )
}
