import { buildingSprite } from '../assets/sprites'
import { buildingDef } from '../game/content/buildings'
import { resourceName } from '../game/content/resources'
import { canAfford, costEntries, costOf, maxAffordable } from '../game/economy'
import { formatNumber, formatPercent } from '../game/format'
import type { BuildingId } from '../game/types'
import { useGame } from '../store/context'

export type BuyAmount = 1 | 10 | 'max'

interface BuildingCardProps {
  id: BuildingId
  amount: BuyAmount
}

export function BuildingCard({ id, amount }: BuildingCardProps) {
  const def = buildingDef(id)
  const owned = useGame((s) => s.game.buildings[id])
  const resources = useGame((s) => s.game.resources)
  const efficiency = useGame((s) => (def.kind === 'processor' ? s.game.efficiency[def.id] : 1))
  const buy = useGame((s) => s.buy)

  const count = amount === 'max' ? Math.max(1, maxAffordable(id, owned, resources)) : amount
  const cost = costOf(id, owned, count)
  const affordable = canAfford(resources, cost)
  const starving = def.kind === 'processor' && efficiency < 0.999

  return (
    <article className={`building ${affordable ? '' : 'building--poor'}`} data-testid={`building-${id}`} data-tour={`building-${id}`}>
      <img className="pixel building__sprite" src={buildingSprite(id)} alt="" width={64} height={64} />
      <div className="building__body">
        <h3 className="building__name">
          {def.name} <span className="building__count">×{owned}</span>
        </h3>
        <p className="building__effect">{def.description}</p>
        {def.kind === 'processor' && owned > 0 && (
          <p className={`building__efficiency ${starving ? 'building__efficiency--low' : ''}`}>
            Эффективность {formatPercent(efficiency)}
            {starving && ` — не хватает ${def.input === 'ore' ? 'руды' : 'сплава'}`}
          </p>
        )}
      </div>
      <button
        type="button"
        className="btn btn--buy"
        disabled={!affordable}
        onClick={() => buy(id, amount)}
        aria-label={`Купить ${def.name} ×${count}`}
      >
        <span className="btn__label">Купить ×{count}</span>
        <span className="btn__cost">
          {costEntries(cost).map(([res, value]) => (
            <span key={res} className={`cost cost--${res} ${resources[res] >= value ? '' : 'cost--short'}`}>
              {formatNumber(value)} {resourceName(res).toLowerCase()}
            </span>
          ))}
        </span>
      </button>
    </article>
  )
}
