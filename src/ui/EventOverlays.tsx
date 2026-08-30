import { SPRITES } from '../assets/sprites'
import { useGame } from '../store/context'

export function EventOverlays() {
  const eventId = useGame((s) => s.game.effects.event?.id ?? null)
  const clickComet = useGame((s) => s.clickComet)
  const clickStrayDrone = useGame((s) => s.clickStrayDrone)

  if (eventId === 'comet') {
    return (
      <button type="button" className="flyby flyby--comet" onClick={clickComet} aria-label="Поймать комету">
        <img className="pixel" src={SPRITES.comet} alt="" width={64} height={64} />
      </button>
    )
  }
  if (eventId === 'strayDrone') {
    return (
      <button type="button" className="flyby flyby--drone" onClick={clickStrayDrone} aria-label="Принять дрона">
        <img className="pixel" src={SPRITES['building-drone']} alt="" width={64} height={64} />
      </button>
    )
  }
  return null
}
