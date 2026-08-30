import { BUILDINGS, COST_GROWTH, buildingDef } from './content/buildings'
import { upgradeDef } from './content/upgrades'
import type {
  BuildingId,
  Cost,
  GameState,
  ProcessorId,
  ProducerId,
  ResourceId,
  UpgradeId,
  Resources,
} from './types'

export const DARK_MATTER_BONUS = 0.1
export const BOOST_MULTIPLIER = 2
export const METEOR_CLICK_MULTIPLIER = 10

export const costEntries = (cost: Cost): [ResourceId, number][] =>
  Object.entries(cost) as [ResourceId, number][]

export function costOf(id: BuildingId, owned: number, count: number): Cost {
  const factor = (COST_GROWTH ** owned * (COST_GROWTH ** count - 1)) / (COST_GROWTH - 1)
  const result: Cost = {}
  for (const [res, base] of costEntries(buildingDef(id).baseCost)) {
    result[res] = base * factor
  }
  return result
}

export const canAfford = (resources: Resources, cost: Cost): boolean =>
  costEntries(cost).every(([res, amount]) => resources[res] >= amount)

export function maxAffordable(id: BuildingId, owned: number, resources: Resources): number {
  let best = Infinity
  for (const [res, base] of costEntries(buildingDef(id).baseCost)) {
    const unit = base * COST_GROWTH ** owned
    const n = Math.floor(Math.log((resources[res] * (COST_GROWTH - 1)) / unit + 1) / Math.log(COST_GROWTH))
    best = Math.min(best, Math.max(0, n))
  }
  while (best > 0 && !canAfford(resources, costOf(id, owned, best))) best -= 1
  while (canAfford(resources, costOf(id, owned, best + 1))) best += 1
  return best
}

export const spend = (resources: Resources, cost: Cost): Resources => {
  const next = { ...resources }
  for (const [res, amount] of costEntries(cost)) next[res] -= amount
  return next
}

export const isBuildingVisible = (state: GameState, id: BuildingId): boolean =>
  costEntries(buildingDef(id).baseCost).every(
    ([res, base]) => state.stats.peakResources[res] >= base / 2,
  )

export interface ProcessorMultiplier {
  input: number
  output: number
}

export interface Multipliers {
  click: number
  producer: Record<ProducerId, number>
  processor: Record<ProcessorId, ProcessorMultiplier>
  global: number
}

export function multipliers(state: GameState): Multipliers {
  const m: Multipliers = {
    click: 1,
    producer: { drone: 1, excavator: 1, laser: 1 },
    processor: { smelter: { input: 1, output: 1 }, factory: { input: 1, output: 1 } },
    global: 1,
  }
  for (const id of state.upgrades) {
    const effect = upgradeDef(id).effect
    switch (effect.target) {
      case 'click':
        m.click *= effect.multiplier
        break
      case 'global':
        m.global *= effect.multiplier
        break
      case 'smelter':
      case 'factory':
        m.processor[effect.target].input *= effect.input
        m.processor[effect.target].output *= effect.output
        break
      default:
        m.producer[effect.target] *= effect.multiplier
    }
  }
  m.global *= 1 + DARK_MATTER_BONUS * state.darkMatter
  if (state.effects.boostRemaining > 0) m.global *= BOOST_MULTIPLIER
  return m
}

export function productionPerSecond(state: GameState, m: Multipliers = multipliers(state)): number {
  let total = 0
  for (const def of BUILDINGS) {
    if (def.kind !== 'producer') continue
    total += state.buildings[def.id] * def.rate * m.producer[def.id]
  }
  return total * m.global
}

export interface ProcessorRates {
  input: number
  yieldRatio: number
}

export function processorRates(
  state: GameState,
  id: ProcessorId,
  m: Multipliers = multipliers(state),
): ProcessorRates {
  const def = buildingDef(id)
  if (def.kind !== 'processor') throw new Error(`${id} is not a processor`)
  const pm = m.processor[id]
  return {
    input: state.buildings[id] * def.inputRate * pm.input * m.global,
    yieldRatio: (def.outputRate * pm.output) / (def.inputRate * pm.input),
  }
}

export function clickValue(state: GameState): number {
  const m = multipliers(state)
  const meteor = state.effects.meteorRemaining > 0 ? METEOR_CLICK_MULTIPLIER : 1
  return m.click * (1 + DARK_MATTER_BONUS * state.darkMatter) * meteor
}

export function netRates(state: GameState): Resources {
  const m = multipliers(state)
  const smelter = processorRates(state, 'smelter', m)
  const factory = processorRates(state, 'factory', m)
  const oreEaten = smelter.input * state.efficiency.smelter
  const alloyEaten = factory.input * state.efficiency.factory
  return {
    ore: productionPerSecond(state, m) - oreEaten,
    alloy: oreEaten * smelter.yieldRatio - alloyEaten,
    chip: alloyEaten * factory.yieldRatio,
  }
}

export function applyClick(state: GameState): GameState {
  const gain = clickValue(state)
  const ore = state.resources.ore + gain
  return {
    ...state,
    resources: { ...state.resources, ore },
    stats: {
      ...state.stats,
      clicks: state.stats.clicks + 1,
      totalProduced: { ...state.stats.totalProduced, ore: state.stats.totalProduced.ore + gain },
      peakResources: { ...state.stats.peakResources, ore: Math.max(state.stats.peakResources.ore, ore) },
    },
  }
}

export function buyBuilding(state: GameState, id: BuildingId, count: number | 'max'): GameState | null {
  const owned = state.buildings[id]
  const n = count === 'max' ? maxAffordable(id, owned, state.resources) : count
  if (n <= 0) return null
  const cost = costOf(id, owned, n)
  if (!canAfford(state.resources, cost)) return null
  return {
    ...state,
    resources: spend(state.resources, cost),
    buildings: { ...state.buildings, [id]: owned + n },
  }
}

export function buyUpgrade(state: GameState, id: UpgradeId): GameState | null {
  const def = upgradeDef(id)
  if (state.upgrades.includes(id) || !def.isUnlocked(state) || !canAfford(state.resources, def.cost)) return null
  return {
    ...state,
    resources: spend(state.resources, def.cost),
    upgrades: [...state.upgrades, id],
  }
}
