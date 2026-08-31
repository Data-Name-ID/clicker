import { artifactDef } from '../game/content/artifacts'
import { challengeDef } from '../game/content/challenges'
import { eventDef } from '../game/content/events'
import { formatDuration } from '../game/format'
import { useGame } from '../store/context'

export function BuffBar() {
  const game = useGame((s) => s.game)
  const now = useGame((s) => s.now)
  const acceptOffer = useGame((s) => s.acceptOffer)
  const declineOffer = useGame((s) => s.declineOffer)
  const chips: { key: string; className: string; text: string }[] = []

  if (game.effects.boostRemaining > 0) {
    chips.push({ key: 'boost', className: 'buff--boost', text: `Перегрузка ${formatDuration(game.effects.boostRemaining * 1000)}` })
  }
  if (game.effects.meteorRemaining > 0) {
    chips.push({ key: 'meteor', className: 'buff--meteor', text: `Дождь ${formatDuration(game.effects.meteorRemaining * 1000)}` })
  }
  if (game.protocol !== 'balance') {
    chips.push({ key: 'protocol', className: 'buff--protocol', text: game.protocol === 'mining' ? 'Протокол: ДОБЫЧА' : 'Протокол: ЗАВОД' })
  }
  if (game.artifact) {
    chips.push({ key: 'artifact', className: 'buff--artifact', text: artifactDef(game.artifact).name })
  }
  if (game.challenge) {
    const def = challengeDef(game.challenge.id)
    const left = def.timeLimitMs !== undefined ? ` ${formatDuration(Math.max(0, def.timeLimitMs - (now - game.challenge.startedAt)))}` : ''
    chips.push({ key: 'challenge', className: 'buff--challenge', text: `Испытание: ${def.name}${left}` })
  }

  const event = game.effects.event
  const eventInfo = event ? eventDef(event.id) : null
  const isOffer = eventInfo?.kind === 'offer'

  return (
    <div className="buff-bar" aria-label="Активные эффекты" data-testid="buff-bar">
      {event && eventInfo && eventInfo.kind !== 'spawn' && (
        <span className={`buff buff--event ${isOffer ? 'buff--offer' : ''}`} title={eventInfo.description}>
          {eventInfo.name} {formatDuration(event.remaining * 1000)}
          {isOffer && (
            <span className="buff__actions">
              <button type="button" className="buff__btn buff__btn--yes" onClick={acceptOffer} aria-label="Обменять">
                ✓
              </button>
              <button type="button" className="buff__btn buff__btn--no" onClick={declineOffer} aria-label="Отказаться">
                ✗
              </button>
            </span>
          )}
        </span>
      )}
      {chips.map((c) => (
        <span key={c.key} className={`buff ${c.className}`}>
          {c.text}
        </span>
      ))}
    </div>
  )
}
