import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { simulate, simulateChunked } from './tick'

describe('simulate', () => {
  it('gives 5 ore per second from 10 drones', () => {
    const state = buildState({ buildings: { drone: 10 } })

    const next = simulate(state, 1)

    expect(next.resources.ore).toBe(5)
    expect(next.stats.totalProduced.ore).toBe(5)
  })

  it('runs smelters at 40 % when only 4 of 10 ore are available', () => {
    const state = buildState({ buildings: { smelter: 5 }, resources: { ore: 4 } })

    const next = simulate(state, 1)

    expect(next.efficiency.smelter).toBeCloseTo(0.4, 10)
    expect(next.resources.ore).toBe(0)
    expect(next.resources.alloy).toBe(2)
  })

  it('runs factories at 0 % without alloy', () => {
    const state = buildState({ buildings: { factory: 3 } })

    const next = simulate(state, 1)

    expect(next.efficiency.factory).toBe(0)
    expect(next.resources.chip).toBe(0)
  })

  it('counts chips produced in this run', () => {
    const state = buildState({ buildings: { factory: 2 }, resources: { alloy: 100 } })

    const next = simulate(state, 1)

    expect(next.resources.chip).toBe(2)
    expect(next.stats.runChips).toBe(2)
    expect(next.resources.alloy).toBe(90)
  })

  it('splits the step when the boost expires inside it', () => {
    const state = buildState({ buildings: { drone: 10 }, effects: { boostRemaining: 0.5 } })

    const next = simulate(state, 1)

    expect(next.resources.ore).toBe(7.5)
    expect(next.effects.boostRemaining).toBe(0)
  })

  it('counts consecutive seconds of idle smelters', () => {
    const state = buildState({ buildings: { smelter: 1 } })

    const next = simulate(simulate(state, 30), 31)

    expect(next.stats.smelterIdleSeconds).toBe(61)
  })

  it('resets idle counter when smelters get ore', () => {
    const state = buildState({ buildings: { smelter: 1 }, stats: { smelterIdleSeconds: 50 }, resources: { ore: 100 } })

    const next = simulate(state, 1)

    expect(next.stats.smelterIdleSeconds).toBe(0)
  })

  it('tracks peak resources', () => {
    const state = buildState({ buildings: { drone: 10 } })

    const next = simulate(state, 20)

    expect(next.stats.peakResources.ore).toBe(100)
  })

  it('applies catalyst as extra yield at the same input', () => {
    const state = buildState({ buildings: { smelter: 1 }, upgrades: ['smelter2'], resources: { ore: 100 } })

    const next = simulate(state, 1)

    expect(next.resources.ore).toBe(98)
    expect(next.resources.alloy).toBe(1.5)
  })
})

describe('simulateChunked', () => {
  it('matches a single simulate call for constant production', () => {
    const state = buildState({ buildings: { drone: 10 } })

    const next = simulateChunked(state, 150, 60)

    expect(next.resources.ore).toBe(750)
  })
})

describe('neurolab chain', () => {
  it('turns chips into cores', () => {
    const state = buildState({ buildings: { neurolab: 2 }, resources: { chip: 100 } })

    const next = simulate(state, 1)

    expect(next.resources.chip).toBe(80)
    expect(next.resources.core).toBe(1)
    expect(next.stats.runCores).toBe(1)
  })

  it('dreams keep half output without chips', () => {
    const state = buildState({ buildings: { neurolab: 1 }, upgrades: ['dream'] })

    const next = simulate(state, 1)

    expect(next.efficiency.neurolab).toBe(0)
    expect(next.resources.core).toBe(0.25)
  })
})

describe('events in simulate', () => {
  it('gold vein multiplies ore production by 5', () => {
    const state = buildState({ buildings: { drone: 10 }, effects: { event: { id: 'goldVein', remaining: 30 } } })

    expect(simulate(state, 1).resources.ore).toBe(25)
  })

  it('splits the step when the event expires inside it', () => {
    const state = buildState({ buildings: { drone: 10 }, effects: { event: { id: 'goldVein', remaining: 0.5 } } })

    const next = simulate(state, 1)

    expect(next.resources.ore).toBe(15)
    expect(next.effects.event).toBeNull()
  })

  it('magnetic storm halts smelters', () => {
    const state = buildState({ buildings: { smelter: 5 }, resources: { ore: 100 }, effects: { event: { id: 'magneticStorm', remaining: 45 } } })

    const next = simulate(state, 1)

    expect(next.resources.ore).toBe(100)
    expect(next.efficiency.smelter).toBe(0)
  })
})
