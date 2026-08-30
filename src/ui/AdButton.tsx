import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import type { AdPlacement } from '../ads/AdProvider'
import { adProvider } from '../ads'
import { SPRITES } from '../assets/sprites'
import { formatDuration } from '../game/format'
import { cooldownRemaining } from '../game/rewards'
import { useGame } from '../store/context'
import { AD_INFO, AD_WATCH_NOTE } from './adInfo'

interface AdButtonProps {
  placement: AdPlacement
  label: string
  activeLabel?: string
  activeRemaining?: number
  disabled?: boolean
  className?: string
}

const TIP_WIDTH = 280
const TIP_MARGIN = 12

function tipStyle(anchor: HTMLElement | null): CSSProperties {
  if (!anchor) return {}
  const r = anchor.getBoundingClientRect()
  const width = Math.min(TIP_WIDTH, window.innerWidth - TIP_MARGIN * 2)
  const left = Math.min(Math.max(TIP_MARGIN, r.left + r.width / 2 - width / 2), window.innerWidth - TIP_MARGIN - width)
  const above = r.top > 180
  return above ? { left, width, bottom: window.innerHeight - r.top + 8 } : { left, width, top: r.bottom + 8 }
}

export function AdButton({ placement, label, activeLabel, activeRemaining = 0, disabled, className }: AdButtonProps) {
  const cooldown = useGame((s) => cooldownRemaining(s.game, placement, s.now))
  const busy = useGame((s) => s.adBusy !== null)
  const watchAd = useGame((s) => s.watchAd)
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const anchor = useRef<HTMLDivElement>(null)
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

  if (!adProvider.isAvailable(placement)) return null

  const info = AD_INFO[placement]
  const active = activeRemaining > 0
  const blocked = disabled || busy || cooldown > 0 || active
  let caption = label
  if (active) caption = `${activeLabel ?? label}: ${formatDuration(activeRemaining * 1000)}`
  else if (cooldown > 0) caption = `${label} (${formatDuration(cooldown)})`

  return (
    <div
      className={`ad-action ${className ?? ''}`}
      ref={anchor}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        className={`btn btn--ad ${active ? 'btn--active' : ''}`}
        disabled={blocked}
        onClick={() => void watchAd(placement)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-describedby={open ? tipId : undefined}
      >
        <img className="pixel btn__ad-mark" src={SPRITES['ad-mark']} alt="" width={16} height={16} />
        <span>{caption}</span>
      </button>
      <button
        type="button"
        className={`ad-action__info ${pinned ? 'ad-action__info--on' : ''}`}
        aria-label={`Подробнее: ${info.title}`}
        aria-expanded={open}
        onClick={() => setPinned((p) => !p)}
      >
        ?
      </button>
      {open && (
        <div className="tooltip frame" role="tooltip" id={tipId} style={tipStyle(anchor.current)}>
          <b className="tooltip__title">{info.title}</b>
          <span>{info.effect}</span>
          <span className="tooltip__muted">{info.cooldown}</span>
          <span className="tooltip__muted">{AD_WATCH_NOTE}</span>
          {cooldown > 0 && !active && <span className="tooltip__cooldown">Снова через {formatDuration(cooldown)}</span>}
        </div>
      )}
    </div>
  )
}
