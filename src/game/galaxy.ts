import { challengeDef } from './content/challenges'
import { hasShip } from './content/ship'
import { talentLevel } from './content/talents'
import { activateQuest } from './quests'
import { createInitialState, type ChallengeId, type GameState } from './types'

export const GALAXY_MIN_PRESTIGES = 5
export const GALAXY_MIN_DARK_MATTER = 100

export const canGalaxyReset = (state: GameState): boolean =>
  state.prestigeCount >= GALAXY_MIN_PRESTIGES && state.darkMatter >= GALAXY_MIN_DARK_MATTER

export const shardsGain = (state: GameState): number =>
  Math.floor(Math.sqrt(state.darkMatter / 10) * (1 + 0.1 * talentLevel(state, 'shardResonance')))

export function startingBuildings(state: GameState, withShip: boolean): GameState['buildings'] {
  const fresh = createInitialState().buildings
  return {
    ...fresh,
    drone:
      (withShip && hasShip(state, 'crewMemory') ? Math.min(state.buildings.drone, 10) : 0) +
      5 * talentLevel(state, 'startBoost'),
    smelter: withShip && hasShip(state, 'autoSmelter') ? 1 : 0,
    excavator: withShip && hasShip(state, 'autoSmelter') ? 1 : 0,
  }
}

export function resetRun(state: GameState, now: number, withShip: boolean): GameState {
  const fresh = createInitialState()
  return activateQuest(
    {
      ...state,
      resources: {
        ...fresh.resources,
        ore: withShip && hasShip(state, 'startCargo') ? 1000 : 0,
        alloy: withShip && hasShip(state, 'stasisStore') ? 200 : 0,
      },
      buildings: startingBuildings(state, withShip),
      upgrades: [],
      protocol: 'balance',
      combo: 0,
      lastClickAt: 0,
      charge: 0,
      effects: { boostRemaining: 0, meteorRemaining: 0, event: null },
      efficiency: { smelter: 1, factory: 1, neurolab: 1 },
      stats: { ...state.stats, runChips: 0, runCores: 0, runClicks: 0, smelterIdleSeconds: 0, strayDrones: 0, runStartedAt: now },
    },
    state.quest.index,
  )
}

export function applyGalaxyReset(state: GameState, now: number): GameState {
  const gain = shardsGain(state)
  const cleared: GameState = {
    ...state,
    darkMatter: 0,
    prestigeCount: 0,
    artifact: null,
    artifactsSeen: [],
    expeditions: [],
    challenge: null,
    shards: state.shards + gain,
    galaxyCount: state.galaxyCount + 1,
  }
  return resetRun(cleared, now, true)
}

export function startChallenge(state: GameState, id: ChallengeId, now: number): GameState {
  if (state.challenge) return state
  return resetRun({ ...state, challenge: { id, startedAt: now } }, now, false)
}

export function exitChallenge(state: GameState, now: number): GameState {
  if (!state.challenge) return state
  return resetRun({ ...state, challenge: null }, now, true)
}

export interface ChallengeOutcome {
  id: ChallengeId
  name: string
  success: boolean
  shards: number
}

export function challengeOutcomeOnPrestige(state: GameState, now: number): ChallengeOutcome | null {
  if (!state.challenge) return null
  const def = challengeDef(state.challenge.id)
  const inTime = def.timeLimitMs === undefined || now - state.challenge.startedAt <= def.timeLimitMs
  const first = !state.challengesDone.includes(def.id)
  return {
    id: def.id,
    name: def.name,
    success: inTime,
    shards: inTime && first ? def.reward : 0,
  }
}

export function settleChallenge(state: GameState, outcome: ChallengeOutcome): GameState {
  return {
    ...state,
    challenge: null,
    shards: state.shards + outcome.shards,
    challengesDone:
      outcome.success && !state.challengesDone.includes(outcome.id)
        ? [...state.challengesDone, outcome.id]
        : state.challengesDone,
  }
}
