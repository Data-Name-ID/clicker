import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { BUILDING_IDS } from '../game/content/buildings'
import { hasShip } from '../game/content/ship'
import { isBuildingVisible, protocolsUnlocked } from '../game/economy'
import type { ProtocolId } from '../game/types'
import { useGame } from '../store/context'
import { AdButton } from './AdButton'
import { BuildingCard, type BuyAmount } from './BuildingCard'

const PROTOCOLS: { id: ProtocolId; label: string }[] = [
  { id: 'balance', label: 'Баланс' },
  { id: 'mining', label: 'Добыча' },
  { id: 'factory', label: 'Завод' },
]

export function BuildingList() {
  const [amount, setAmount] = useState<BuyAmount>(1)
  const visible = useGame(useShallow((s) => BUILDING_IDS.filter((id) => isBuildingVisible(s.game, id))))
  const wholesale = useGame((s) => hasShip(s.game, 'wholesale'))
  const protocolsOn = useGame((s) => protocolsUnlocked(s.game))
  const protocol = useGame((s) => s.game.protocol)
  const switchProtocol = useGame((s) => s.switchProtocol)
  const amounts: BuyAmount[] = wholesale ? [1, 10, 100, 'max'] : [1, 10, 'max']

  return (
    <div className="panel-body" data-tour="buildings">
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Количество">
          {amounts.map((a) => (
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
        <AdButton placement="supply" label="Экстренная поставка" />
      </div>
      {protocolsOn && (
        <div className="protocols" role="group" aria-label="Протокол ИИ">
          <span className="protocols__label">Протокол:</span>
          {PROTOCOLS.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`btn btn--seg ${protocol === p.id ? 'btn--on' : ''}`}
              onClick={() => switchProtocol(p.id)}
              aria-pressed={protocol === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {visible.length === 0 && <p className="empty">Бей по астероиду — здания появятся, как накопится руда.</p>}
      {visible.map((id) => (
        <BuildingCard key={id} id={id} amount={amount} />
      ))}
    </div>
  )
}
