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
export const COMBO_WINDOW_MS = 2_000
export const COMBO_MAX = 100
export const CRIT_MULTIPLIER = 10
export const BASE_CRIT_CHANCE = 0.05
export const UPGRADED_CRIT_CHANCE = 0.1
export const CHARGE_MAX = 100
export const DISCHARGE_SECONDS = 60
export const MILESTONE_THRESHOLDS = [25, 50, 100, 150, 200]

export const costEntries = (cost: Cost): [ResourceId, number][] =>
  Object.entries(cost) as [ResourceId, number][]

export const hasUpgrade = (state: GameState, id: UpgradeId): boolean => state.upgrades.includes(id)

export const costDiscount = (state: GameState): number => (state.artifact === 'oldBlueprint' ? 0.8 : 1)

export const milestoneLevel = (owned: number): number =>
  MILESTONE_THRESHOLDS.filter((t) => owned >= t).length

export const nextMilestone = (owned: number): number | null =>
  MILESTONE_THRESHOLDS.find((t) => owned < t) ?? null

const milestoneMultiplier = (owned: number): number => 2 ** milestoneLevel(owned)

export const totalBuildings = (state: GameState): number =>
  Object.values(state.buildings).reduce((sum, n) => sum + n, 0)

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
  m.producer.drone *= milestoneMultiplier(state.buildings.drone)
  m.producer.excavator *= milestoneMultiplier(state.buildings.excavator)
  m.producer.laser *= milestoneMultiplier(state.buildings.laser)
  for (const id of ['smelter', 'factory', 'neurolab'] as const) {
    const mult = milestoneMultiplier(state.buildings[id])
    m.processor[id].input *= mult
    m.processor[id].output *= mult
  }

  m.processor.smelter.input *= 1 + 0.01 * state.buildings.excavator
  m.processor.smelter.output *= 1 + 0.01 * state.buildings.excavator
  const conveyor = 1 + 0.01 * Math.floor(state.buildings.drone / 5)
  m.processor.factory.input *= conveyor
  m.processor.factory.output *= conveyor
  m.producer.laser *= 1 + 0.05 * state.buildings.neurolab
  m.click *= 1 + 0.005 * totalBuildings(state)

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

export const critChance = (state: GameState): number =>
  hasUpgrade(state, 'crit1') ? UPGRADED_CRIT_CHANCE : BASE_CRIT_CHANCE

export const comboActive = (state: GameState, now: number): number =>
  state.combo > 0 && now - state.lastClickAt <= COMBO_WINDOW_MS ? state.combo : 0

export const comboMultiplier = (combo: number): number =>
  1 + Math.min(COMBO_MAX, Math.max(0, combo - 1)) / COMBO_MAX

export interface ClickResult {
  state: GameState
  gain: number
  crit: boolean
  combo: number
}

export function performClick(state: GameState, now = 0, roll = 1, bonus = 1): ClickResult {
  const m = multipliers(state)
  const combo = Math.min(COMBO_MAX + 1, comboActive(state, now) + 1)
  const crit = roll < critChance(state)
  const gain =
    clickValue(state, m) * comboMultiplier(combo) * (crit ? CRIT_MULTIPLIER : 1) * bonus +
    productionPerSecond(state, m) * m.clickProducerSeconds
  const ore = state.resources.ore + gain
  const inWindow = now - state.stats.clickBurstStart <= CLICK_BURST_WINDOW_MS
  const next: GameState = {
    ...state,
    resources: { ...state.resources, ore },
    combo,
    lastClickAt: now,
    charge: Math.min(CHARGE_MAX, state.charge + 1),
    stats: {
      ...state.stats,
      clicks: state.stats.clicks + 1,
      runClicks: state.stats.runClicks + 1,
      noClickSeconds: 0,
      comboBest: Math.max(state.stats.comboBest, combo),
      clickBurstStart: inWindow ? state.stats.clickBurstStart : now,
      clickBurstCount: inWindow ? state.stats.clickBurstCount + 1 : 1,
      totalProduced: { ...state.stats.totalProduced, ore: state.stats.totalProduced.ore + gain },
      peakResources: { ...state.stats.peakResources, ore: Math.max(state.stats.peakResources.ore, ore) },
    },
  }
  return { state: next, gain, crit, combo }
}

export const applyClick = (state: GameState, now = 0): GameState => performClick(state, now).state

export function applyDischarge(state: GameState): GameState {
  if (state.charge < CHARGE_MAX) return state
  const gain = productionPerSecond(state) * DISCHARGE_SECONDS
  return {
    ...state,
    charge: 0,
    resources: { ...state.resources, ore: state.resources.ore + gain },
    stats: {
      ...state.stats,
      discharges: state.stats.discharges + 1,
      totalProduced: { ...state.stats.totalProduced, ore: state.stats.totalProduced.ore + gain },
      peakResources: {
        ...state.stats.peakResources,
        ore: Math.max(state.stats.peakResources.ore, state.resources.ore + gain),
      },
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

export interface BuildingInfo {
  kind: 'producer' | 'processor'
  perUnit: number
  total: number
  inputPerUnit: number
  outputPerUnit: number
}

export function buildingInfo(state: GameState, id: BuildingId, m: Multipliers = multipliers(state)): BuildingInfo {
  const def = buildingDef(id)
  const owned = state.buildings[id]
  if (def.kind === 'producer') {
    const perUnit = def.rate * m.producer[def.id] * m.producerAll * m.global
    return { kind: 'producer', perUnit, total: perUnit * owned, inputPerUnit: 0, outputPerUnit: perUnit }
  }
  const rates = processorRates(state, def.id, m)
  const inputPerUnit = owned > 0 ? rates.input / owned : def.inputRate * m.processor[def.id].input * m.global
  return {
    kind: 'processor',
    perUnit: inputPerUnit * rates.yieldRatio,
    total: rates.input * rates.yieldRatio,
    inputPerUnit,
    outputPerUnit: inputPerUnit * rates.yieldRatio,
  }
}

export function secondsUntilAffordable(state: GameState, cost: Cost): number | null {
  const rates = netRates(state)
  let worst = 0
  for (const [res, amount] of costEntries(cost)) {
    const missing = amount - state.resources[res]
    if (missing <= 0) continue
    if (rates[res] <= 0) return null
    worst = Math.max(worst, missing / rates[res])
  }
  return worst > 0 ? worst : 0
}

export function setProtocol(state: GameState, protocol: GameState['protocol']): GameState {
  if (state.protocol === protocol || !hasUpgrade(state, 'protocols')) return state
  return {
    ...state,
    protocol,
    stats: { ...state.stats, protocolSwitches: state.stats.protocolSwitches + 1 },
  }
}
