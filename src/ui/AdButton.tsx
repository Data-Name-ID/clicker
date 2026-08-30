import type { AdPlacement } from '../ads/AdProvider'
import { adProvider } from '../ads'
import { formatDuration } from '../game/format'
import { cooldownRemaining } from '../game/rewards'
import { useGame } from '../store/context'

interface AdButtonProps {
  placement: AdPlacement
  label: string
  hint?: string
  activeLabel?: string
  activeRemaining?: number
  disabled?: boolean
  className?: string
}

export function AdButton({ placement, label, hint, activeLabel, activeRemaining = 0, disabled, className }: AdButtonProps) {
  const cooldown = useGame((s) => cooldownRemaining(s.game, placement, s.now))
  const busy = useGame((s) => s.adBusy !== null)
  const watchAd = useGame((s) => s.watchAd)
  if (!adProvider.isAvailable(placement)) return null

  const active = activeRemaining > 0
  const blocked = disabled || busy || cooldown > 0 || active
  let caption = label
  if (active) caption = `${activeLabel ?? label}: ${formatDuration(activeRemaining * 1000)}`
  else if (cooldown > 0) caption = `${label} (${formatDuration(cooldown)})`

  return (
    <button
      type="button"
      className={`btn btn--ad ${active ? 'btn--active' : ''} ${className ?? ''}`}
      disabled={blocked}
      onClick={() => void watchAd(placement)}
      title={hint}
    >
      <span className="btn__ad-mark" aria-hidden="true">▶</span> {caption}
    </button>
  )
}
