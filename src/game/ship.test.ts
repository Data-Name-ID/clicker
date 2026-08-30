import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { autoDrillRate, buyShipUpgrade } from './content/ship'
import { applyAutoDrill, applyBoost, applySupply, boostDuration, supplySeconds } from './rewards'
import { applyOffline } from './save'
import { simulateChunked } from './tick'

const NOW = 1_700_000_000_000

describe('buyShipUpgrade', () => {
  it('spends dark matter', () => {
    const next = buyShipUpgrade(buildState({ darkMatter: 12 }), 'cargoBay')

    expect(next?.darkMatter).toBe(0)
    expect(next?.shipUpgrades).toEqual(['cargoBay'])
  })

  it('rejects a purchase without enough dark matter', () => {
    expect(buyShipUpgrade(buildState({ darkMatter: 11 }), 'cargoBay')).toBeNull()
  })

  it('rejects a duplicate purchase', () => {
    expect(buyShipUpgrade(buildState({ darkMatter: 50, shipUpgrades: ['cargoBay'] }), 'cargoBay')).toBeNull()
  })

  it('requires the first auto drill for the second', () => {
    expect(buyShipUpgrade(buildState({ darkMatter: 100 }), 'autoDrill2')).toBeNull()
    expect(buyShipUpgrade(buildState({ darkMatter: 100, shipUpgrades: ['autoDrill'] }), 'autoDrill2')).not.toBeNull()
  })
})

describe('autoDrill', () => {
  it('rates are 0, 1 and 5', () => {
    expect(autoDrillRate(buildState())).toBe(0)
    expect(autoDrillRate(buildState({ shipUpgrades: ['autoDrill'] }))).toBe(1)
    expect(autoDrillRate(buildState({ shipUpgrades: ['autoDrill', 'autoDrill2'] }))).toBe(5)
  })

  it('adds click value per second', () => {
    const state = buildState({ shipUpgrades: ['autoDrill'] })

    expect(applyAutoDrill(state, 10).resources.ore).toBe(10)
  })
})

describe('thrusters and long range', () => {
  it('extend the boost to 15 minutes', () => {
    const state = buildState({ shipUpgrades: ['thrusters'] })

    expect(boostDuration(state)).toBe(900)
    expect(applyBoost(state, NOW).effects.boostRemaining).toBe(900)
  })

  it('double the supply window', () => {
    const state = buildState({ buildings: { drone: 10 }, shipUpgrades: ['longRange'] })

    expect(supplySeconds(state)).toBe(3600)
    expect(applySupply(state, NOW).resources.ore).toBe(simulateChunked(state, 3600, 60).resources.ore)
  })
})

describe('offline ship upgrades', () => {
  it('cargo bay extends the cap to 24 hours', () => {
    const state = buildState({ buildings: { drone: 10 }, shipUpgrades: ['cargoBay'], savedAt: NOW - 30 * 3600 * 1000 })

    const result = applyOffline(state, NOW)

    expect(result.elapsed).toBe(86_400)
    expect(result.state.resources.ore).toBe(432_000)
  })

  it('double hold multiplies offline gains by 1.5', () => {
    const state = buildState({ buildings: { drone: 10 }, shipUpgrades: ['doubleHold'], savedAt: NOW - 8 * 3600 * 1000 })

    const result = applyOffline(state, NOW)

    expect(result.gains.ore).toBe(216_000)
    expect(result.state.resources.ore).toBe(216_000)
  })
})
