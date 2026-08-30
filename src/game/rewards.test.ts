import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import {
  applyArtifactRerollCooldown,
  applyBoost,
  applyEventRushCooldown,
  applyMeteorShower,
  applyOfflineDouble,
  applySupply,
  cooldownRemaining,
  recordAdWatched,
} from './rewards'
import { simulateChunked } from './tick'

const NOW = 1_700_000_000_000

describe('applyBoost', () => {
  it('starts a 10 minute boost with a cooldown 30 minutes after it ends', () => {
    const next = applyBoost(buildState(), NOW)

    expect(next.effects.boostRemaining).toBe(600)
    expect(next.cooldowns.boostUntil).toBe(NOW + 40 * 60 * 1000)
  })
})

describe('applySupply', () => {
  it('gives the same resources as 30 minutes of simulate', () => {
    const state = buildState({ buildings: { drone: 10, smelter: 2, factory: 1 }, resources: { ore: 50 } })

    const next = applySupply(state, NOW)

    expect(next.resources).toEqual(simulateChunked(state, 1800, 60).resources)
    expect(next.resources.chip).toBeCloseTo(720, 6)
  })

  it('sets a 45 minute cooldown and keeps effect timers', () => {
    const state = buildState({ effects: { boostRemaining: 300 } })

    const next = applySupply(state, NOW)

    expect(next.cooldowns.supplyUntil).toBe(NOW + 45 * 60 * 1000)
    expect(next.effects.boostRemaining).toBe(300)
  })
})

describe('applyMeteorShower', () => {
  it('starts a 30 second shower with a 10 minute cooldown', () => {
    const next = applyMeteorShower(buildState(), NOW)

    expect(next.effects.meteorRemaining).toBe(30)
    expect(next.cooldowns.meteorUntil).toBe(NOW + 10 * 60 * 1000)
  })
})

describe('applyOfflineDouble', () => {
  it('adds the gains once more to resources and stats', () => {
    const state = buildState({ resources: { ore: 100, alloy: 10, chip: 1 }, stats: { runChips: 1 } })

    const next = applyOfflineDouble(state, { ore: 50, alloy: 5, chip: 2, core: 0 })

    expect(next.resources).toEqual({ ore: 150, alloy: 15, chip: 3, core: 0 })
    expect(next.stats.totalProduced).toEqual({ ore: 50, alloy: 5, chip: 2, core: 0 })
    expect(next.stats.runChips).toBe(3)
  })
})

describe('cooldownRemaining', () => {
  it('reports the remaining boost cooldown', () => {
    const state = buildState({ cooldowns: { boostUntil: NOW + 5000 } })

    expect(cooldownRemaining(state, 'boost', NOW)).toBe(5000)
  })

  it('is zero once the cooldown passed', () => {
    const state = buildState({ cooldowns: { supplyUntil: NOW - 1 } })

    expect(cooldownRemaining(state, 'supply', NOW)).toBe(0)
  })
})

describe('recordAdWatched', () => {
  it('increments the counter', () => {
    expect(recordAdWatched(buildState({ stats: { adsWatched: 9 } })).stats.adsWatched).toBe(10)
  })
})

describe('new ad cooldowns', () => {
  it('artifact reroll charges for 30 minutes', () => {
    const next = applyArtifactRerollCooldown(buildState(), NOW)

    expect(next.cooldowns.rerollUntil).toBe(NOW + 30 * 60 * 1000)
    expect(cooldownRemaining(next, 'artifactReroll', NOW + 60_000)).toBe(29 * 60 * 1000)
  })

  it('event rush charges for 10 minutes', () => {
    const next = applyEventRushCooldown(buildState(), NOW)

    expect(cooldownRemaining(next, 'eventRush', NOW)).toBe(10 * 60 * 1000)
  })

  it('cat double has no cooldown', () => {
    expect(cooldownRemaining(buildState(), 'catDouble', NOW)).toBe(0)
  })
})
