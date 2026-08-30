import { eventDef } from '../game/content/events'
import { formatDuration } from '../game/format'
import { useGame } from '../store/context'

export function EventBanner() {
  const event = useGame((s) => s.game.effects.event)
  const acceptOffer = useGame((s) => s.acceptOffer)
  const declineOffer = useGame((s) => s.declineOffer)
  if (!event) return null
  const def = eventDef(event.id)
  if (def.kind === 'spawn') return null

  return (
    <div className={`event-banner event-banner--${def.kind}`} role="status" data-testid="event-banner">
      <div className="event-banner__body">
        <b className="event-banner__name">{def.name}</b>
        <span className="event-banner__desc">{def.description}</span>
      </div>
      <span className="event-banner__timer">{formatDuration(event.remaining * 1000)}</span>
      {def.kind === 'offer' && (
        <div className="event-banner__actions">
          <button type="button" className="btn btn--primary" onClick={acceptOffer}>
            Обменять
          </button>
          <button type="button" className="btn" onClick={declineOffer}>
            Отказаться
          </button>
        </div>
      )}
    </div>
  )
}
