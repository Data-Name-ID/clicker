import { eligibleEvents, eventDef } from './content/events'
import { hasShip } from './content/ship'
import { hasSkill } from './content/skills'
import { hasUpgrade, multipliers, productionPerSecond } from './economy'
import type { EventId, GameState, Resources } from './types'

export const EVENT_DELAY_BASE = 240
export const EVENT_DELAY_SPREAD = 180
export const EVENT_RETRY_DELAY = 30
export const CAT_DELAY_BASE = 1500
export const CAT_DELAY_SPREAD = 600
export const CARAVAN_RATE = 0.6
export const BLACK_MARKET_RATE = 0.22
export const COMET_REWARD_SECONDS = 600
export const METEOR_REWARD_SECONDS = 30
export const SLING_REFUND_MS = 10_000

export function nextEventDelay(state: GameState, roll: number): number {
  let delay = EVENT_DELAY_BASE + roll * EVENT_DELAY_SPREAD
  if (hasShip(state, 'darkAntenna')) delay /= 1.5
  if (state.artifact === 'lotteryTicket') delay /= 2
  if (hasSkill(state, 'astro1')) delay /= 1.15
  if (hasSkill(state, 'astro4')) delay /= 1.25
  return delay
}

export const eventDurationMultiplier = (state: GameState): number => (hasSkill(state, 'astro2') ? 1.5 : 1)

export const meteorRewardSeconds = (state: GameState): number => (hasSkill(state, 'astro3') ? 60 : METEOR_REWARD_SECONDS)

export const cometRewardSeconds = (state: GameState): number => (hasSkill(state, 'astro5') ? 1200 : COMET_REWARD_SECONDS)

export const caravanRate = (state: GameState): number => (hasSkill(state, 'astro6') ? 0.9 : CARAVAN_RATE)

export const blackMarketRate = (state: GameState): number => (hasSkill(state, 'astro6') ? 0.33 : BLACK_MARKET_RATE)

export function addResources(state: GameState, delta: Partial<Resources>): GameState {
  const resources = { ...state.resources }
  const totalProduced = { ...state.stats.totalProduced }
  const peakResources = { ...state.stats.peakResources }
  for (const [key, value] of Object.entries(delta) as [keyof Resources, number][]) {
    resources[key] += value
    if (value > 0) totalProduced[key] += value
    peakResources[key] = Math.max(peakResources[key], resources[key])
  }
  return {
    ...state,
    resources,
    stats: {
      ...state.stats,
      totalProduced,
      peakResources,
      runChips: state.stats.runChips + Math.max(0, delta.chip ?? 0),
      runCores: state.stats.runCores + Math.max(0, delta.core ?? 0),
    },
  }
}

export interface EventTickResult {
  state: GameState
  started: EventId | null
}

export function tickEvents(state: GameState, dt: number, rolls: [number, number]): EventTickResult {
  if (state.effects.event) return { state, started: null }
  if (state.challenge?.id === 'blind') {
    return { state: { ...state, eventCountdown: Math.max(0, state.eventCountdown - dt) }, started: null }
  }
  const countdown = state.eventCountdown - dt
  if (countdown > 0) return { state: { ...state, eventCountdown: countdown }, started: null }
  const pool = eligibleEvents(state)
  if (pool.length === 0) {
    return { state: { ...state, eventCountdown: EVENT_RETRY_DELAY }, started: null }
  }
  const picked = pool[Math.min(pool.length - 1, Math.max(0, Math.floor(rolls[0] * pool.length)))]
  return {
    state: {
      ...state,
      effects: { ...state.effects, event: { id: picked.id, remaining: picked.duration * eventDurationMultiplier(state) } },
      eventCountdown: nextEventDelay(state, rolls[1]),
      stats: { ...state.stats, eventsSeen: state.stats.eventsSeen + 1 },
    },
    started: picked.id,
  }
}

export function startRandomEvent(state: GameState, rolls: [number, number]): EventTickResult {
  if (state.effects.event) return { state, started: null }
  const pool = eligibleEvents(state)
  if (pool.length === 0) return { state, started: null }
  const picked = pool[Math.min(pool.length - 1, Math.max(0, Math.floor(rolls[0] * pool.length)))]
  return {
    state: {
      ...state,
      effects: { ...state.effects, event: { id: picked.id, remaining: picked.duration * eventDurationMultiplier(state) } },
      eventCountdown: nextEventDelay(state, rolls[1]),
      stats: { ...state.stats, eventsSeen: state.stats.eventsSeen + 1 },
    },
    started: picked.id,
  }
}

export const clearEvent = (state: GameState): GameState => ({
  ...state,
  effects: { ...state.effects, event: null },
})

export function declineOffer(state: GameState): GameState {
  const id = state.effects.event?.id
  const isOffer = id === 'caravan' || id === 'blackMarket'
  const cleared = clearEvent(state)
  if (!isOffer) return cleared
  return { ...cleared, stats: { ...cleared.stats, offersDeclined: cleared.stats.offersDeclined + 1 } }
}

export function acceptCaravan(state: GameState): GameState {
  if (state.effects.event?.id !== 'caravan') return state
  const given = state.resources.ore / 2
  return clearEvent(addResources(state, { ore: -given, alloy: given * caravanRate(state) }))
}

export function acceptBlackMarket(state: GameState): GameState {
  if (state.effects.event?.id !== 'blackMarket') return state
  const given = state.resources.alloy / 2
  return clearEvent(addResources(state, { alloy: -given, chip: given * blackMarketRate(state) }))
}

export function catchComet(state: GameState): GameState {
  if (state.effects.event?.id !== 'comet') return state
  return clearEvent(addResources(state, { ore: productionPerSecond(state) * cometRewardSeconds(state) }))
}

export function catchStrayDrone(state: GameState): GameState {
  if (state.effects.event?.id !== 'strayDrone') return state
  return clearEvent({
    ...state,
    buildings: { ...state.buildings, drone: state.buildings.drone + 1 },
    stats: { ...state.stats, strayDrones: state.stats.strayDrones + 1 },
  })
}

export function catchMeteor(state: GameState): GameState {
  const withOre = addResources(state, { ore: productionPerSecond(state) * meteorRewardSeconds(state) })
  const slingRefund = hasUpgrade(state, 'sling') ? SLING_REFUND_MS : 0
  return {
    ...withOre,
    cooldowns: { ...withOre.cooldowns, boostUntil: withOre.cooldowns.boostUntil - slingRefund },
    stats: { ...withOre.stats, meteorsCaught: withOre.stats.meteorsCaught + 1 },
  }
}

export const isMeteorShowerActive = (state: GameState): boolean =>
  state.effects.meteorRemaining > 0 || state.effects.event?.id === 'meteorHail'

export interface CatBoxReward {
  text: string
  delta: Partial<Resources>
}

export function openCatBox(state: GameState, roll: number): CatBoxReward {
  const production = productionPerSecond(state)
  if (roll < 0.4) return { text: 'В ящике руда — 5 минут добычи!', delta: { ore: Math.max(50, production * 300) } }
  if (roll < 0.8) {
    const m = multipliers(state)
    const smelterOut = state.buildings.smelter * 1 * m.processor.smelter.output * m.global
    return { text: 'В ящике сплав — 5 минут плавки!', delta: { alloy: Math.max(20, smelterOut * 300) } }
  }
  return { text: 'Ящик пуст. Кот выглядит довольным.', delta: {} }
}

export function tickLive(state: GameState, dt: number, hour: number): GameState {
  return {
    ...state,
    catCountdown: Math.max(0, state.catCountdown - dt),
    stats: {
      ...state.stats,
      noClickSeconds: state.stats.noClickSeconds + dt,
      nightOwl: state.stats.nightOwl || hour === 3,
    },
  }
}

export const nextCatDelay = (roll: number): number => CAT_DELAY_BASE + roll * CAT_DELAY_SPREAD

export const catchCat = (state: GameState): GameState => ({
  ...state,
  stats: { ...state.stats, caughtCat: true, catsCaught: state.stats.catsCaught + 1 },
})

export const useDisco = (state: GameState): GameState => ({
  ...state,
  stats: { ...state.stats, discoUsed: true, discoCount: state.stats.discoCount + 1 },
})

export const eventName = (id: EventId): string => eventDef(id).name
