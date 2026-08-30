import { useEffect, useRef, useState } from 'react'
import { buildingSprite } from '../assets/sprites'
import { buildingDef } from '../game/content/buildings'
import { resourceName } from '../game/content/resources'
import {
  buildingInfo,
  canAfford,
  costEntries,
  costOf,
  maxAffordable,
  milestoneLevel,
  nextMilestone,
  secondsUntilAffordable,
} from '../game/economy'
import { formatDuration, formatNumber, formatPercent, formatRate } from '../game/format'
import type { BuildingId } from '../game/types'
import { useGame } from '../store/context'
import { InfoTip } from './InfoTip'

export type BuyAmount = 1 | 10 | 100 | 'max'

interface BuildingCardProps {
  id: BuildingId
  amount: BuyAmount
}

const FLASH_MS = 450

const RESOURCE_GENITIVE: Record<string, string> = {
  ore: 'руды',
  alloy: 'сплава',
  chip: 'чипов',
  core: 'ядер',
}

export function BuildingCard({ id, amount }: BuildingCardProps) {
  const def = buildingDef(id)
  const game = useGame((s) => s.game)
  const buy = useGame((s) => s.buy)
  const owned = game.buildings[id]
  const resources = game.resources
  const efficiency = def.kind === 'processor' ? game.efficiency[def.id] : 1
  const [flash, setFlash] = useState(false)
  const prevOwned = useRef(owned)

  useEffect(() => {
    if (owned > prevOwned.current) {
      setFlash(true)
      const timer = setTimeout(() => setFlash(false), FLASH_MS)
      prevOwned.current = owned
      return () => clearTimeout(timer)
    }
    prevOwned.current = owned
  }, [owned])

  const count = amount === 'max' ? Math.max(1, maxAffordable(game, id, owned, resources)) : amount
  const cost = costOf(game, id, owned, count)
  const affordable = canAfford(resources, cost)
  const starving = def.kind === 'processor' && owned > 0 && efficiency < 0.999
  const info = buildingInfo(game, id)
  const milestone = nextMilestone(owned)
  const eta = affordable ? 0 : secondsUntilAffordable(game, cost)
  const io = def.kind === 'processor' ? { input: RESOURCE_GENITIVE[def.input], output: RESOURCE_GENITIVE[def.output] } : null

  return (
    <article
      className={`building ${affordable ? '' : 'building--poor'} ${flash ? 'building--flash' : ''}`}
      data-testid={`building-${id}`}
      data-tour={`building-${id}`}
    >
      <img className="pixel building__sprite" src={buildingSprite(id)} alt="" width={64} height={64} />
      <div className="building__body">
        <h3 className="building__name">
          {def.name} <span className="building__count">×{owned}</span>{' '}
          <InfoTip label={`Подробнее: ${def.name}`}>
            <b className="tooltip__title">{def.name}</b>
            {owned > 0 && (
              <span>
                {io === null
                  ? `Сейчас добывают ${formatRate(info.total)} руды/с — по ${formatRate(info.perUnit)} каждый.`
                  : `Каждая берёт ${formatRate(info.inputPerUnit)} ${io.input}/с и выдаёт ${formatRate(info.outputPerUnit)} ${io.output}/с.`}
              </span>
            )}
            {milestone !== null && (
              <span>
                Ещё {milestone - owned} шт — и все «{def.name}» получат бонус ×{2 ** (milestoneLevel(owned) + 1)} ({owned} / {milestone}).
              </span>
            )}
            {!affordable && eta !== null && eta > 0 && (
              <span className="tooltip__muted">На покупку накопится через ~{formatDuration(eta * 1000)}.</span>
            )}
          </InfoTip>
        </h3>
        <p className="building__effect">{def.description}</p>
        {def.kind === 'processor' && owned > 0 && (
          <p className={`building__efficiency ${starving ? 'building__efficiency--low' : ''}`}>
            Эффективность {formatPercent(efficiency)}
            {starving && ` — не хватает ${def.input === 'ore' ? 'руды' : def.input === 'alloy' ? 'сплава' : 'чипов'}`}
          </p>
        )}
      </div>
      <button
        type="button"
        className={`btn btn--buy ${affordable ? 'btn--ready' : ''}`}
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
