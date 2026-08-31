import type { GameState, ShipUpgradeId } from '../types'

export interface ShipUpgradeDef {
  id: ShipUpgradeId
  name: string
  description: string
  cost: number
  requires?: ShipUpgradeId
}

export const SHIP_UPGRADES: ShipUpgradeDef[] = [
  { id: 'startCargo', name: 'Стартовый капитал', description: 'Новый забег начинается с 1 000 руды', cost: 5 },
  { id: 'autoDrill', name: 'Автобур', description: 'Бур стучит сам — удар в секунду', cost: 10 },
  { id: 'cargoBay', name: 'Грузовой отсек', description: 'Пока тебя нет, копится до 24 часов вместо 8', cost: 12 },
  { id: 'stasisStore', name: 'Стазис-склад', description: 'Новый забег начинается с 200 сплава', cost: 15 },
  { id: 'wholesale', name: 'Оптовик', description: 'Появляется кнопка покупки сразу сотни зданий', cost: 18 },
  { id: 'thrusters', name: 'Разгонные дюзы', description: 'Перегрузка держится 15 минут, дождь — 45 секунд', cost: 20 },
  { id: 'autoSmelter', name: 'Автоплавильня', description: 'Новый забег начинается с плавильней и экскаватором', cost: 22 },
  { id: 'crewMemory', name: 'Память экипажа', description: 'После перелёта с тобой остаются десять дронов', cost: 25 },
  { id: 'longRange', name: 'Дальняя связь', description: 'Экстренная поставка привозит час работы вместо получаса', cost: 30 },
  { id: 'darkAntenna', name: 'Тёмная антенна', description: 'События случаются в полтора раза чаще', cost: 35 },
  { id: 'darkCompiler', name: 'Тёмный компилятор', description: 'Лаборатории дают +50 % ядер даром', cost: 38 },
  { id: 'doubleHold', name: 'Двойной трюм', description: 'Из офлайна привозишь в полтора раза больше', cost: 45 },
  { id: 'autoDrill2', name: 'Автобур II', description: 'Бур стучит впятеро быстрее', cost: 50, requires: 'autoDrill' },
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
