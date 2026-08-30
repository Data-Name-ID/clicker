import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { tipStyle } from './tipStyle'

interface InfoTipProps {
  label: string
  children: ReactNode
}

export function InfoTip({ label, children }: InfoTipProps) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const anchor = useRef<HTMLSpanElement>(null)
  const tipId = useId()
  const open = hover || pinned

  useEffect(() => {
    if (!pinned) return
    const close = (event: Event) => {
      if (anchor.current?.contains(event.target as Node)) return
      setPinned(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPinned(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [pinned])

  return (
    <span className="info-tip" ref={anchor} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        type="button"
        className={`info-tip__btn ${pinned ? 'info-tip__btn--on' : ''}`}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setPinned((p) => !p)}
      >
        i
      </button>
      {open &&
        createPortal(
          <span className="tooltip frame" role="tooltip" id={tipId} style={tipStyle(anchor.current)}>
            {children}
          </span>,
          document.body,
        )}
    </span>
  )
}
