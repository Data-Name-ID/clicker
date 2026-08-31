import { EXPEDITION_PARTY_SIZES, expeditionKindDef } from './content/expeditions'
import { hasSkill } from './content/skills'
import { talentLevel } from './content/talents'
import { multipliers } from './economy'
import { addResources } from './events'
import type { Expedition, ExpeditionKind, GameState, Resources } from './types'

export const EXPEDITION_FAIL_CHANCE = 0.15
export const EXPEDITION_RARE_CHANCE = 0.25
export const EXPEDITION_DM_CHANCE = 0.2

export const maxExpeditionSlots = (state: GameState): number =>
  1 + talentLevel(state, 'expeditionCorps') + (hasSkill(state, 'captain7') ? 1 : 0)

export const expeditionFailChance = (state: GameState): number =>
  hasSkill(state, 'captain2') ? 0.1 : EXPEDITION_FAIL_CHANCE

export const expeditionRareChance = (state: GameState): number =>
  EXPEDITION_RARE_CHANCE + (hasSkill(state, 'captain3') ? 0.1 : 0)

export const busyDrones = (state: GameState): number =>
  state.expeditions.reduce((sum, e) => sum + e.drones, 0)

export function canStartExpedition(state: GameState, kind: ExpeditionKind, drones: number): boolean {
  return (
    EXPEDITION_PARTY_SIZES.includes(drones) &&
    state.expeditions.length < maxExpeditionSlots(state) &&
    state.buildings.drone - busyDrones(state) >= drones &&
    expeditionKindDef(kind) !== undefined
  )
}

export function startExpedition(state: GameState, kind: ExpeditionKind, drones: number, now: number): GameState | null {
  if (!canStartExpedition(state, kind, drones)) return null
  const def = expeditionKindDef(kind)
  const expedition: Expedition = { kind, drones, endsAt: now + def.durationSec * 1000 }
  return { ...state, expeditions: [...state.expeditions, expedition] }
}

export const isExpeditionReady = (expedition: Expedition, now: number): boolean => now >= expedition.endsAt

export interface ExpeditionResult {
  state: GameState
  outcome: 'fail' | 'rare' | 'normal'
  gains: Partial<Resources>
  lostDrones: number
  darkMatter: number
}

export function collectExpedition(
  state: GameState,
  index: number,
  now: number,
  rolls: [number, number],
): ExpeditionResult | null {
  const expedition = state.expeditions[index]
  if (!expedition || !isExpeditionReady(expedition, now)) return null
  const def = expeditionKindDef(expedition.kind)
  const remaining = state.expeditions.filter((_, i) => i !== index)
  let current: GameState = { ...state, expeditions: remaining }

  if (rolls[0] < expeditionFailChance(current)) {
    const insured = talentLevel(current, 'insurance') > 0
    const divisor = hasSkill(current, 'captain4') ? 4 : 2
    const lost = insured ? 0 : Math.floor(expedition.drones / divisor)
    current = {
      ...current,
      buildings: { ...current.buildings, drone: Math.max(0, current.buildings.drone - lost) },
      stats: {
        ...current.stats,
        expeditionsDone: current.stats.expeditionsDone + 1,
        expeditionsFailed: current.stats.expeditionsFailed + 1,
      },
    }
    return { state: current, outcome: 'fail', gains: {}, lostDrones: lost, darkMatter: 0 }
  }

  const m = multipliers(current)
  const skillScale = (hasSkill(current, 'captain1') ? 1.25 : 1) * (hasSkill(current, 'captain6') ? 1.5 : 1)
  const perDrone = 0.5 * m.producer.drone * m.producerAll * m.global
  const ore = perDrone * expedition.drones * def.durationSec * def.rewardScale * skillScale
  const rare = rolls[0] < expeditionFailChance(current) + expeditionRareChance(current)
  const gains: Partial<Resources> = rare
    ? { ore, alloy: ore * 0.2, chip: ore * 0.02, core: ore * 0.001 }
    : { ore, alloy: ore * 0.1 }
  const dm = (rare && rolls[1] < EXPEDITION_DM_CHANCE ? 1 : 0) + (rare && hasSkill(current, 'captain8') ? 1 : 0)
  current = addResources(current, gains)
  current = {
    ...current,
    darkMatter: current.darkMatter + dm,
    stats: { ...current.stats, expeditionsDone: current.stats.expeditionsDone + 1 },
  }
  return { state: current, outcome: rare ? 'rare' : 'normal', gains, lostDrones: 0, darkMatter: dm }
}
