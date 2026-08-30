import { artifactDef } from '../game/content/artifacts'
import { SHIP_UPGRADES } from '../game/content/ship'
import { formatNumber } from '../game/format'
import {
  PRESTIGE_THRESHOLD,
  bonusDarkMatterGain,
  canPrestige,
  coreMultiplier,
  darkMatterGain,
} from '../game/prestige'
import { useGame } from '../store/context'
import { AdButton } from './AdButton'

export function PrestigePanel() {
  const runChips = useGame((s) => s.game.stats.runChips)
  const runCores = useGame((s) => s.game.stats.runCores)
  const darkMatter = useGame((s) => s.game.darkMatter)
  const prestigeCount = useGame((s) => s.game.prestigeCount)
  const artifact = useGame((s) => s.game.artifact)
  const shipUpgrades = useGame((s) => s.game.shipUpgrades)
  const ready = useGame((s) => canPrestige(s.game))
  const gain = useGame((s) => darkMatterGain(s.game))
  const bonusGain = useGame((s) => bonusDarkMatterGain(s.game))
  const coresMult = useGame((s) => coreMultiplier(s.game))
  const prestige = useGame((s) => s.prestige)
  const buyShip = useGame((s) => s.buyShip)
  const progress = Math.min(1, runChips / PRESTIGE_THRESHOLD)

  return (
    <div className="panel-body">
      <p>
        Перелёт сбрасывает ресурсы, здания и улучшения, но даёт <b>тёмную материю</b>: +10 % к добыче, переработке и
        клику за каждую единицу.
      </p>
      <p className="muted">
        Перелётов: {prestigeCount} · Тёмной материи: {formatNumber(darkMatter)}
      </p>
      {artifact && (
        <div className="artifact" data-testid="artifact">
          <span className="artifact__label">Артефакт забега:</span>
          <b>{artifactDef(artifact).name}</b>
          <span className="muted"> — {artifactDef(artifact).description}</span>
          <AdButton placement="artifactReroll" label="Сменить артефакт" className="artifact__reroll" />
        </div>
      )}
      <div className="progress" role="progressbar" aria-valuenow={Math.floor(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress__fill" style={{ width: `${progress * 100}%` }} />
        <span className="progress__label">
          {formatNumber(runChips)} / {formatNumber(PRESTIGE_THRESHOLD)} чипов
        </span>
      </div>
      <p>
        Награда: <b className="dm">{gain}</b> тёмной материи
        {ready ? '' : ` — нужно ещё ${formatNumber(PRESTIGE_THRESHOLD - runChips)} чипов`}
      </p>
      <p className="muted">
        ИИ-ядра усиливают награду: {formatNumber(runCores)} ядер за этот забег дают множитель ×{coresMult.toFixed(2)}.
        Первые 50 ядер удваивают награду, дальше рост замедляется.
      </p>
      <div className="actions">
        <button type="button" className="btn btn--primary" disabled={!ready} onClick={prestige}>
          Перелёт (+{gain})
        </button>
        <AdButton placement="prestigeBonus" label={`Перелёт с бонусом (+${bonusGain})`} disabled={!ready} />
      </div>
      <section className="ship">
        <h3>Корабль</h3>
        <p className="muted">
          Улучшения за тёмную материю — навсегда. Внимание: трата ТМ уменьшает пассивный бонус (−10 % за единицу).
        </p>
        {SHIP_UPGRADES.map((u) => {
          const bought = shipUpgrades.includes(u.id)
          const locked = u.requires !== undefined && !shipUpgrades.includes(u.requires)
          const affordable = darkMatter >= u.cost && !locked
          return (
            <article className={`upgrade ${bought ? 'upgrade--bought' : ''}`} key={u.id} data-testid={`ship-${u.id}`}>
              <div className="upgrade__body">
                <h3 className="upgrade__name">{u.name}</h3>
                <p className="upgrade__effect">{u.description}</p>
                {locked && <p className="upgrade__req">Нужен: {SHIP_UPGRADES.find((x) => x.id === u.requires)!.name}</p>}
              </div>
              {bought ? (
                <span className="ship__bought">Куплено</span>
              ) : (
                <button type="button" className="btn btn--buy" disabled={!affordable} onClick={() => buyShip(u.id)}>
                  <span className="btn__label">Купить</span>
                  <span className="btn__cost">
                    <span className="cost cost--dm">
                      {u.cost} ТМ (−{u.cost * 10} %)
                    </span>
                  </span>
                </button>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}
