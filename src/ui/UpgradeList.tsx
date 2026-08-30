import { useShallow } from 'zustand/react/shallow'
import { resourceName } from '../game/content/resources'
import { UPGRADES } from '../game/content/upgrades'
import { canAfford, costEntries } from '../game/economy'
import { formatNumber } from '../game/format'
import { useGame } from '../store/context'

export function UpgradeList() {
  const bought = useGame((s) => s.game.upgrades)
  const resources = useGame((s) => s.game.resources)
  const available = useGame(
    useShallow((s) => UPGRADES.filter((u) => !s.game.upgrades.includes(u.id) && u.isUnlocked(s.game)).map((u) => u.id)),
  )
  const buyUpgrade = useGame((s) => s.buyUpgrade)

  return (
    <div className="panel-body">
      {available.length === 0 && <p className="empty">Новых улучшений пока нет — стройте и добывайте.</p>}
      {available.map((id) => {
        const def = UPGRADES.find((u) => u.id === id)!
        const affordable = canAfford(resources, def.cost)
        return (
          <article className={`upgrade ${affordable ? '' : 'upgrade--poor'}`} key={id}>
            <div className="upgrade__body">
              <h3 className="upgrade__name">{def.name}</h3>
              <p className="upgrade__effect">{def.description}</p>
              <p className="upgrade__req">Условие: {def.requirement}</p>
            </div>
            <button type="button" className="btn btn--buy" disabled={!affordable} onClick={() => buyUpgrade(id)}>
              <span className="btn__label">Купить</span>
              <span className="btn__cost">
                {costEntries(def.cost).map(([res, value]) => (
                  <span key={res} className={`cost cost--${res}`}>
                    {formatNumber(value)} {resourceName(res).toLowerCase()}
                  </span>
                ))}
              </span>
            </button>
          </article>
        )
      })}
      {bought.length > 0 && (
        <details className="bought">
          <summary>Куплено: {bought.length}</summary>
          <ul>
            {bought.map((id) => {
              const def = UPGRADES.find((u) => u.id === id)!
              return (
                <li key={id}>
                  {def.name} — {def.description}
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}
