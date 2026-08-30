import type { GameState, ShipUpgradeId } from '../types'

export interface ShipUpgradeDef {
  id: ShipUpgradeId
  name: string
  description: string
  cost: number
  requires?: ShipUpgradeId
}

export const SHIP_UPGRADES: ShipUpgradeDef[] = [
  { id: 'startCargo', name: 'Стартовый капитал', description: 'Каждый забег начинается с 1 000 руды', cost: 2 },
  { id: 'autoDrill', name: 'Автобур', description: 'Автоклик 1 раз/с, пока игра открыта', cost: 4 },
  { id: 'cargoBay', name: 'Грузовой отсек', description: 'Кап оффлайн-прогресса 8 ч → 24 ч', cost: 5 },
  { id: 'stasisStore', name: 'Стазис-склад', description: 'Каждый забег начинается с 200 сплава', cost: 6 },
  { id: 'wholesale', name: 'Оптовик', description: 'Кнопка ×100 в покупках зданий', cost: 7 },
  { id: 'thrusters', name: 'Разгонные дюзы', description: '«Перегрузка» 15 мин, «Дождь» 45 с', cost: 8 },
  { id: 'autoSmelter', name: 'Автоплавильня', description: 'Старт с 1 плавильней и 1 экскаватором', cost: 9 },
  { id: 'crewMemory', name: 'Память экипажа', description: 'После перелёта сохраняются первые 10 дронов', cost: 10 },
  { id: 'longRange', name: 'Дальняя связь', description: '«Экстренная поставка» даёт 60 минут вместо 30', cost: 12 },
  { id: 'darkAntenna', name: 'Тёмная антенна', description: 'События происходят в 1,5 раза чаще', cost: 14 },
  { id: 'darkCompiler', name: 'Тёмный компилятор', description: 'Нейролаборатории: выход ×1,5 при том же входе', cost: 15 },
  { id: 'doubleHold', name: 'Двойной трюм', description: 'Оффлайн-прогресс приносит ×1,5 ресурсов', cost: 18 },
  { id: 'autoDrill2', name: 'Автобур II', description: 'Автоклик 5 раз/с', cost: 20, requires: 'autoDrill' },
]

export const shipUpgradeDef = (id: ShipUpgradeId): ShipUpgradeDef => SHIP_UPGRADES.find((u) => u.id === id)!

export const hasShip = (state: GameState, id: ShipUpgradeId): boolean => state.shipUpgrades.includes(id)

export function buyShipUpgrade(state: GameState, id: ShipUpgradeId): GameState | null {
  const def = shipUpgradeDef(id)
  if (state.shipUpgrades.includes(id)) return null
  if (def.requires && !state.shipUpgrades.includes(def.requires)) return null
  if (state.darkMatter < def.cost) return null
  return { ...state, darkMatter: state.darkMatter - def.cost, shipUpgrades: [...state.shipUpgrades, id] }
}

export const autoDrillRate = (state: GameState): number =>
  hasShip(state, 'autoDrill2') ? 5 : hasShip(state, 'autoDrill') ? 1 : 0
