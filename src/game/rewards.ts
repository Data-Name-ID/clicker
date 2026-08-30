import { simulateChunked } from './tick'
import type { GameState, Resources } from './types'

export type AdPlacement = 'boost' | 'offlineDouble' | 'supply' | 'prestigeBonus' | 'meteorShower'

export const BOOST_DURATION = 10 * 60
export const BOOST_COOLDOWN_MS = 30 * 60 * 1000
export const SUPPLY_SECONDS = 30 * 60
export const SUPPLY_COOLDOWN_MS = 60 * 60 * 1000
export const METEOR_DURATION = 30
export const METEOR_COOLDOWN_MS = 15 * 60 * 1000

export const recordAdWatched = (state: GameState): GameState => ({
  ...state,
  stats: { ...state.stats, adsWatched: state.stats.adsWatched + 1 },
})

export const applyBoost = (state: GameState, now: number): GameState => ({
  ...state,
  effects: { ...state.effects, boostRemaining: BOOST_DURATION },
  cooldowns: { ...state.cooldowns, boostUntil: now + BOOST_DURATION * 1000 + BOOST_COOLDOWN_MS },
})

export const applySupply = (state: GameState, now: number): GameState => {
  const simulated = simulateChunked(state, SUPPLY_SECONDS)
  return {
    ...simulated,
    effects: { ...state.effects },
    cooldowns: { ...state.cooldowns, supplyUntil: now + SUPPLY_COOLDOWN_MS },
  }
}

export const applyMeteorShower = (state: GameState, now: number): GameState => ({
  ...state,
  effects: { ...state.effects, meteorRemaining: METEOR_DURATION },
  cooldowns: { ...state.cooldowns, meteorUntil: now + METEOR_COOLDOWN_MS },
})

export const applyOfflineDouble = (state: GameState, gains: Resources): GameState => ({
  ...state,
  resources: {
    ore: state.resources.ore + gains.ore,
    alloy: state.resources.alloy + gains.alloy,
    chip: state.resources.chip + gains.chip,
  },
  stats: {
    ...state.stats,
    totalProduced: {
      ore: state.stats.totalProduced.ore + gains.ore,
      alloy: state.stats.totalProduced.alloy + gains.alloy,
      chip: state.stats.totalProduced.chip + gains.chip,
    },
    runChips: state.stats.runChips + gains.chip,
  },
})

export function cooldownRemaining(state: GameState, placement: AdPlacement, now: number): number {
  switch (placement) {
    case 'boost':
      return Math.max(0, state.cooldowns.boostUntil - now)
    case 'supply':
      return Math.max(0, state.cooldowns.supplyUntil - now)
    case 'meteorShower':
      return Math.max(0, state.cooldowns.meteorUntil - now)
    default:
      return 0
  }
}
