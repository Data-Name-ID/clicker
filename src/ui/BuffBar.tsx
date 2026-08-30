import { artifactDef } from '../game/content/artifacts'
import { eventDef } from '../game/content/events'
import { comboActive, comboMultiplier } from '../game/economy'
import { formatDuration } from '../game/format'
import { useGame } from '../store/context'

export function BuffBar() {
  const game = useGame((s) => s.game)
  const now = useGame((s) => s.now)
  const combo = comboActive(game, now)
  const chips: { key: string; className: string; text: string }[] = []

  if (game.effects.boostRemaining > 0) {
    chips.push({ key: 'boost', className: 'buff--boost', text: `Перегрузка ${formatDuration(game.effects.boostRemaining * 1000)}` })
  }
  if (game.effects.meteorRemaining > 0) {
    chips.push({ key: 'meteor', className: 'buff--meteor', text: `Дождь ${formatDuration(game.effects.meteorRemaining * 1000)}` })
  }
  if (game.effects.event) {
    chips.push({
      key: 'event',
      className: 'buff--event',
      text: `${eventDef(game.effects.event.id).name} ${formatDuration(game.effects.event.remaining * 1000)}`,
    })
  }
  if (game.protocol !== 'balance') {
    chips.push({ key: 'protocol', className: 'buff--protocol', text: game.protocol === 'mining' ? 'Протокол: ДОБЫЧА' : 'Протокол: ЗАВОД' })
  }
  if (combo > 1) {
    chips.push({ key: 'combo', className: 'buff--combo', text: `Комбо ×${comboMultiplier(combo).toFixed(2)}` })
  }
  if (game.artifact) {
    chips.push({ key: 'artifact', className: 'buff--artifact', text: artifactDef(game.artifact).name })
  }
  if (chips.length === 0) return null

  return (
    <div className="buff-bar" aria-label="Активные эффекты" data-testid="buff-bar">
      {chips.map((c) => (
        <span key={c.key} className={`buff ${c.className}`}>
          {c.text}
        </span>
      ))}
    </div>
  )
}
