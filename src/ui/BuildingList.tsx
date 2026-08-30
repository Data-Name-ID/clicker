import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { BUILDING_IDS } from '../game/content/buildings'
import { isBuildingVisible } from '../game/economy'
import { useGame } from '../store/context'
import { AdButton } from './AdButton'
import { BuildingCard, type BuyAmount } from './BuildingCard'

const AMOUNTS: BuyAmount[] = [1, 10, 'max']

export function BuildingList() {
  const [amount, setAmount] = useState<BuyAmount>(1)
  const visible = useGame(useShallow((s) => BUILDING_IDS.filter((id) => isBuildingVisible(s.game, id))))

  return (
    <div className="panel-body" data-tour="buildings">
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Количество">
          {AMOUNTS.map((a) => (
            <button
              type="button"
              key={a}
              className={`btn btn--seg ${amount === a ? 'btn--on' : ''}`}
              onClick={() => setAmount(a)}
              aria-pressed={amount === a}
            >
              {a === 'max' ? 'max' : `×${a}`}
            </button>
          ))}
        </div>
        <AdButton placement="supply" label="Экстренная поставка" hint="Ресурсы за 30 минут текущего производства" />
      </div>
      {visible.length === 0 && <p className="empty">Кликайте по астероиду — здания появятся, когда накопится руда.</p>}
      {visible.map((id) => (
        <BuildingCard key={id} id={id} amount={amount} />
      ))}
    </div>
  )
}
