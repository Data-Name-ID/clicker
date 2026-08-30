import { BUILDINGS, COST_GROWTH, buildingDef } from './content/buildings'
import { upgradeDef } from './content/upgrades'
import { hasShip } from './content/ship'
import { tutorialStep } from './tutorial'
import type {
  BuildingId,
  Cost,
  GameState,
  ProcessorId,
  ProducerId,
  ResourceId,
  Resources,
  UpgradeId,
} from './types'

export const DARK_MATTER_BONUS = 0.1
export const BOOST_MULTIPLIER = 2
export const METEOR_CLICK_MULTIPLIER = 10
export const CLICK_BURST_WINDOW_MS = 10_000

export const costEntries = (cost: Cost): [ResourceId, number][] =>
  Object.entries(cost) as [ResourceId, number][]

export const hasUpgrade = (state: GameState, id: UpgradeId): boolean => state.upgrades.includes(id)

export const costDiscount = (state: GameState): number => (state.artifact === 'oldBlueprint' ? 0.8 : 1)

export function costOf(state: GameState, id: BuildingId, owned: number, count: number): Cost {
  const factor =
    (COST_GROWTH ** owned * (COST_GROWTH ** count - 1)) / (COST_GROWTH - 1) * costDiscount(state)
  const result: Cost = {}
  for (const [res, base] of costEntries(buildingDef(id).baseCost)) {
    result[res] = base * factor
  }
  return result
}

export const canAfford = (resources: Resources, cost: Cost): boolean =>
  costEntries(cost).every(([res, amount]) => resources[res] >= amount)

export function maxAffordable(state: GameState, id: BuildingId, owned: number, resources: Resources): number {
  const discount = costDiscount(state)
  let best = Infinity
  for (const [res, base] of costEntries(buildingDef(id).baseCost)) {
    const unit = base * COST_GROWTH ** owned * discount
    const n = Math.floor(Math.log((resources[res] * (COST_GROWTH - 1)) / unit + 1) / Math.log(COST_GROWTH))
    best = Math.min(best, Math.max(0, n))
  }
  while (best > 0 && !canAfford(resources, costOf(state, id, owned, best))) best -= 1
  while (canAfford(resources, costOf(state, id, owned, best + 1))) best += 1
  return best
}

export const spend = (resources: Resources, cost: Cost): Resources => {
  const next = { ...resources }
  for (const [res, amount] of costEntries(cost)) next[res] -= amount
  return next
}

const TUTORIAL_BUILDINGS: BuildingId[] = ['drone', 'smelter', 'factory']

export function isBuildingVisible(state: GameState, id: BuildingId): boolean {
  if (state.buildings[id] > 0) return true
  if (TUTORIAL_BUILDINGS.includes(id) && tutorialStep(state) !== null) return true
  return costEntries(buildingDef(id).baseCost).every(([res, base]) => state.stats.peakResources[res] >= base / 2)
}

export interface ProcessorMultiplier {
  input: number
  output: number
  halted: boolean
  minEfficiency: number
}

export interface Multipliers {
  click: number
  producer: Record<ProducerId, number>
  producerAll: number
  processor: Record<ProcessorId, ProcessorMultiplier>
  global: number
  clickProducerSeconds: number
}

export function darkMatterMultiplier(state: GameState): number {
  const sealBonus = state.artifact === 'voidSeal' ? 1.5 : 1
  return 1 + DARK_MATTER_BONUS * state.darkMatter * sealBonus
}

export function multipliers(state: GameState): Multipliers {
  const m: Multipliers = {
    click: 1,
    producer: { drone: 1, excavator: 1, laser: 1 },
    producerAll: 1,
    processor: {
      smelter: { input: 1, output: 1, halted: false, minEfficiency: 0 },
      factory: { input: 1, output: 1, halted: false, minEfficiency: 0 },
      neurolab: { input: 1, output: 1, halted: false, minEfficiency: 0 },
    },
    global: 1,
    clickProducerSeconds: 0,
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
      case 'neurolab':
        m.processor[effect.target].input *= effect.input
        m.processor[effect.target].output *= effect.output
        break
      case 'special':
        break
      default:
        m.producer[effect.target] *= effect.multiplier
    }
  }
  if (hasUpgrade(state, 'ionwind')) m.producer.drone *= 1 + 0.01 * state.buildings.excavator
  if (hasUpgrade(state, 'tailings')) m.processor.smelter.minEfficiency = Math.max(m.processor.smelter.minEfficiency, 0.25)
  if (hasUpgrade(state, 'dream')) m.processor.neurolab.minEfficiency = Math.max(m.processor.neurolab.minEfficiency, 0.5)
  if (hasUpgrade(state, 'resonance')) m.clickProducerSeconds += 1

  if (state.protocol === 'mining') {
    m.producerAll *= 1.5
    for (const p of Object.values(m.processor)) {
      p.input *= 0.75
      p.output *= 0.75
    }
  } else if (state.protocol === 'factory') {
    m.producerAll *= 0.75
    for (const p of Object.values(m.processor)) {
      p.input *= 1.5
      p.output *= 1.5
    }
  }

  switch (state.artifact) {
    case 'cometShard':
      m.click *= 3
      break
    case 'iridiumVein':
      m.producer.drone *= 2
      break
    case 'focusCrystal':
      m.processor.smelter.output *= 1.5
      break
    case 'rustyExcavator':
      m.producer.excavator *= 2.5
      m.producer.drone *= 0.5
      break
    case 'obsidianLens':
      m.producer.laser *= 2
      break
    case 'hive':
      m.producerAll *= 1 + 0.05 * Math.floor(state.buildings.drone / 10)
      break
    default:
      break
  }

  if (hasShip(state, 'darkCompiler')) m.processor.neurolab.output *= 1.5

  switch (state.effects.event?.id) {
    case 'goldVein':
      m.producerAll *= 5
      break
    case 'magneticStorm':
      m.processor.smelter.halted = true
      m.click *= 5
      break
    case 'solarFlare':
      m.producerAll *= 2
      for (const p of Object.values(m.processor)) {
        p.input *= 0.5
        p.output *= 0.5
      }
      break
    case 'oreFever':
      m.clickProducerSeconds += 2
      break
    case 'dataFog':
      m.processor.neurolab.input *= 3
      m.processor.neurolab.output *= 3
      m.processor.factory.halted = true
      break
    default:
      break
  }

  m.global *= darkMatterMultiplier(state)
  if (state.effects.boostRemaining > 0) m.global *= BOOST_MULTIPLIER
  return m
}

export function productionPerSecond(state: GameState, m: Multipliers = multipliers(state)): number {
  let total = 0
  for (const def of BUILDINGS) {
    if (def.kind !== 'producer') continue
    total += state.buildings[def.id] * def.rate * m.producer[def.id]
  }
  return total * m.producerAll * m.global
}

export interface ProcessorRates {
  input: number
  yieldRatio: number
  halted: boolean
  minEfficiency: number
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
    input: pm.halted ? 0 : state.buildings[id] * def.inputRate * pm.input * m.global,
    yieldRatio: (def.outputRate * pm.output) / (def.inputRate * pm.input),
    halted: pm.halted,
    minEfficiency: pm.minEfficiency,
  }
}

export function clickValue(state: GameState, m: Multipliers = multipliers(state)): number {
  const meteor = state.effects.meteorRemaining > 0 || state.effects.event?.id === 'meteorHail' ? METEOR_CLICK_MULTIPLIER : 1
  const crowd = hasUpgrade(state, 'crowd') && (state.stats.clicks + 1) % 10 === 0 ? 10 : 1
  const hammer = state.artifact === 'minerHammer' && state.stats.runClicks < 100 ? 10 : 1
  return m.click * darkMatterMultiplier(state) * meteor * crowd * hammer
}

export function netRates(state: GameState): Resources {
  const m = multipliers(state)
  const smelter = processorRates(state, 'smelter', m)
  const factory = processorRates(state, 'factory', m)
  const neurolab = processorRates(state, 'neurolab', m)
  const oreEaten = smelter.input * state.efficiency.smelter
  const alloyEaten = factory.input * state.efficiency.factory
  const chipEaten = neurolab.input * state.efficiency.neurolab
  return {
    ore: productionPerSecond(state, m) - oreEaten,
    alloy: oreEaten * smelter.yieldRatio - alloyEaten,
    chip: alloyEaten * factory.yieldRatio - chipEaten,
    core: chipEaten * neurolab.yieldRatio,
  }
}

export function applyClick(state: GameState, now = 0): GameState {
  const m = multipliers(state)
  const gain = clickValue(state, m) + productionPerSecond(state, m) * m.clickProducerSeconds
  const ore = state.resources.ore + gain
  const inWindow = now - state.stats.clickBurstStart <= CLICK_BURST_WINDOW_MS
  return {
    ...state,
    resources: { ...state.resources, ore },
    stats: {
      ...state.stats,
      clicks: state.stats.clicks + 1,
      runClicks: state.stats.runClicks + 1,
      noClickSeconds: 0,
      clickBurstStart: inWindow ? state.stats.clickBurstStart : now,
      clickBurstCount: inWindow ? state.stats.clickBurstCount + 1 : 1,
      totalProduced: { ...state.stats.totalProduced, ore: state.stats.totalProduced.ore + gain },
      peakResources: { ...state.stats.peakResources, ore: Math.max(state.stats.peakResources.ore, ore) },
    },
  }
}

export function buyBuilding(state: GameState, id: BuildingId, count: number | 'max'): GameState | null {
  const owned = state.buildings[id]
  const n = count === 'max' ? maxAffordable(state, id, owned, state.resources) : count
  if (n <= 0) return null
  const cost = costOf(state, id, owned, n)
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

export function setProtocol(state: GameState, protocol: GameState['protocol']): GameState {
  if (state.protocol === protocol || !hasUpgrade(state, 'protocols')) return state
  return {
    ...state,
    protocol,
    stats: { ...state.stats, protocolSwitches: state.stats.protocolSwitches + 1 },
  }
}
