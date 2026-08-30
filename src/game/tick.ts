import { multipliers, processorRates, productionPerSecond } from './economy'
import type { GameState, ProcessorId, Resources } from './types'

const IDLE_EPSILON = 1e-6

export function simulate(state: GameState, dt: number): GameState {
  if (dt <= 0) return state
  const cut = earliestExpiry(state, dt)
  if (cut !== null) return simulate(step(state, cut), dt - cut)
  return step(state, dt)
}

export function simulateChunked(state: GameState, seconds: number, chunk = 60): GameState {
  let current = state
  let left = seconds
  while (left > 0) {
    const dt = Math.min(chunk, left)
    current = simulate(current, dt)
    left -= dt
  }
  return current
}

function earliestExpiry(state: GameState, dt: number): number | null {
  const candidates = [state.effects.boostRemaining, state.effects.meteorRemaining].filter(
    (r) => r > 0 && r < dt,
  )
  return candidates.length ? Math.min(...candidates) : null
}

interface ProcessResult {
  eaten: number
  produced: number
  efficiency: number
}

function process(state: GameState, id: ProcessorId, available: number, dt: number, m: ReturnType<typeof multipliers>): ProcessResult {
  const rates = processorRates(state, id, m)
  const want = rates.input * dt
  if (want <= 0) return { eaten: 0, produced: 0, efficiency: 1 }
  const eaten = Math.min(want, available)
  return { eaten, produced: eaten * rates.yieldRatio, efficiency: eaten / want }
}

function step(state: GameState, dt: number): GameState {
  const m = multipliers(state)
  const oreProduced = productionPerSecond(state, m) * dt
  const ore = state.resources.ore + oreProduced
  const smelter = process(state, 'smelter', ore, dt, m)
  const alloy = state.resources.alloy + smelter.produced
  const factory = process(state, 'factory', alloy, dt, m)

  const resources: Resources = {
    ore: ore - smelter.eaten,
    alloy: alloy - factory.eaten,
    chip: state.resources.chip + factory.produced,
  }
  const smelterIdle = state.buildings.smelter > 0 && smelter.efficiency < IDLE_EPSILON

  return {
    ...state,
    resources,
    stats: {
      ...state.stats,
      totalProduced: {
        ore: state.stats.totalProduced.ore + oreProduced,
        alloy: state.stats.totalProduced.alloy + smelter.produced,
        chip: state.stats.totalProduced.chip + factory.produced,
      },
      runChips: state.stats.runChips + factory.produced,
      smelterIdleSeconds: smelterIdle ? state.stats.smelterIdleSeconds + dt : 0,
      peakResources: {
        ore: Math.max(state.stats.peakResources.ore, resources.ore),
        alloy: Math.max(state.stats.peakResources.alloy, resources.alloy),
        chip: Math.max(state.stats.peakResources.chip, resources.chip),
      },
    },
    effects: {
      boostRemaining: Math.max(0, state.effects.boostRemaining - dt),
      meteorRemaining: Math.max(0, state.effects.meteorRemaining - dt),
    },
    efficiency: { smelter: smelter.efficiency, factory: factory.efficiency },
  }
}
