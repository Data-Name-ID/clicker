import { hasShip, autoDrillRate } from './content/ship'
import { hasSkill } from './content/skills'
import { talentLevel } from './content/talents'
import { clickValue, multipliers } from './economy'
import { addResources } from './events'
import { simulateChunked } from './tick'
import type { GameState, Resources } from './types'

export type AdPlacement =
  | 'boost'
  | 'offlineDouble'
  | 'supply'
  | 'prestigeBonus'
  | 'meteorShower'
  | 'artifactReroll'
  | 'eventRush'
  | 'catDouble'

export const BOOST_DURATION = 10 * 60
export const BOOST_COOLDOWN_MS = 30 * 60 * 1000
export const SUPPLY_SECONDS = 15 * 60
export const SUPPLY_COOLDOWN_MS = 60 * 60 * 1000
export const METEOR_DURATION = 30
export const METEOR_COOLDOWN_MS = 10 * 60 * 1000
export const REROLL_COOLDOWN_MS = 30 * 60 * 1000
export const EVENT_RUSH_COOLDOWN_MS = 10 * 60 * 1000
export const THRUSTERS_MULTIPLIER = 1.5

export const boostDuration = (state: GameState): number =>
  hasShip(state, 'thrusters') ? BOOST_DURATION * THRUSTERS_MULTIPLIER : BOOST_DURATION

export const meteorDuration = (state: GameState): number =>
  (hasShip(state, 'thrusters') ? METEOR_DURATION * THRUSTERS_MULTIPLIER : METEOR_DURATION) +
  (hasSkill(state, 'astro7') ? 15 : 0)

export const supplySeconds = (state: GameState): number =>
  hasShip(state, 'longRange') ? SUPPLY_SECONDS * 2 : SUPPLY_SECONDS

export const cooldownScale = (state: GameState): number =>
  (state.artifact === 'smuggledBooster' ? 0.5 : 1) * (hasSkill(state, 'captain5') ? 0.8 : 1)

export const recordAdWatched = (state: GameState): GameState => ({
  ...state,
  stats: { ...state.stats, adsWatched: state.stats.adsWatched + 1 },
})

export const applyBoost = (state: GameState, now: number): GameState => ({
  ...state,
  effects: { ...state.effects, boostRemaining: boostDuration(state) },
  cooldowns: {
    ...state.cooldowns,
    boostUntil:
      now +
      boostDuration(state) * 1000 +
      BOOST_COOLDOWN_MS * cooldownScale(state) * (talentLevel(state, 'fastBoost') > 0 ? 0.75 : 1),
  },
})

export const applySupply = (state: GameState, now: number): GameState => {
  const simulated = simulateChunked(state, supplySeconds(state))
  return {
    ...simulated,
    effects: { ...state.effects },
    cooldowns: { ...state.cooldowns, supplyUntil: now + SUPPLY_COOLDOWN_MS * cooldownScale(state) },
  }
}

export const applyMeteorShower = (state: GameState, now: number): GameState => ({
  ...state,
  effects: { ...state.effects, meteorRemaining: meteorDuration(state) },
  cooldowns: {
    ...state.cooldowns,
    meteorUntil: now + METEOR_COOLDOWN_MS * cooldownScale(state),
  },
})

export const applyOfflineDouble = (state: GameState, gains: Resources): GameState =>
  addResources(state, gains)

export function applyAutoDrill(state: GameState, dt: number): GameState {
  const rate = autoDrillRate(state)
  if (rate === 0) return state
  const m = multipliers(state)
  const gain = clickValue(state, m) * rate * dt
  return addResources(state, { ore: gain })
}

export const applyArtifactRerollCooldown = (state: GameState, now: number): GameState => ({
  ...state,
  cooldowns: { ...state.cooldowns, rerollUntil: now + REROLL_COOLDOWN_MS * cooldownScale(state) },
})

export const applyEventRushCooldown = (state: GameState, now: number): GameState => ({
  ...state,
  cooldowns: { ...state.cooldowns, eventRushUntil: now + EVENT_RUSH_COOLDOWN_MS * cooldownScale(state) },
})

export function cooldownRemaining(state: GameState, placement: AdPlacement, now: number): number {
  switch (placement) {
    case 'boost':
      return Math.max(0, state.cooldowns.boostUntil - now)
    case 'supply':
      return Math.max(0, state.cooldowns.supplyUntil - now)
    case 'meteorShower':
      return Math.max(0, state.cooldowns.meteorUntil - now)
    case 'artifactReroll':
      return Math.max(0, state.cooldowns.rerollUntil - now)
    case 'eventRush':
      return Math.max(0, state.cooldowns.eventRushUntil - now)
    default:
      return 0
  }
}
