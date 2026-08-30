import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { canAfford, clickValue, costOf, isBuildingVisible, maxAffordable, netRates, productionPerSecond } from './economy'

describe('costOf', () => {
  it('prices 10 drones with none owned', () => {
    expect(costOf('drone', 0, 10).ore).toBeCloseTo(304.56, 2)
  })

  it('prices 10 drones with 5 already owned', () => {
    expect(costOf('drone', 5, 10).ore).toBeCloseTo(612.57, 2)
  })

  it('prices a laser in both currencies', () => {
    expect(costOf('laser', 0, 1)).toEqual({ alloy: 3000, chip: 100 })
  })
})

describe('maxAffordable', () => {
  it('returns how many drones fit into the budget', () => {
    expect(maxAffordable('drone', 0, { ore: 304.56, alloy: 0, chip: 0 })).toBe(10)
  })

  it('returns 0 when the first unit is too expensive', () => {
    expect(maxAffordable('drone', 0, { ore: 14, alloy: 0, chip: 0 })).toBe(0)
  })

  it('is limited by the scarcest currency', () => {
    expect(maxAffordable('laser', 0, { ore: 0, alloy: 1_000_000, chip: 215 })).toBe(2)
  })
})

describe('canAfford', () => {
  it('rejects a cost above the balance', () => {
    expect(canAfford({ ore: 10, alloy: 0, chip: 0 }, { ore: 15 })).toBe(false)
  })
})

describe('isBuildingVisible', () => {
  it('shows a building once half its base price was ever reached', () => {
    const state = buildState({ stats: { peakResources: { ore: 100 } } })

    expect(isBuildingVisible(state, 'excavator')).toBe(true)
  })

  it('hides a building while one of its currencies never reached half price', () => {
    const state = buildState({ stats: { peakResources: { alloy: 1500, chip: 49 } } })

    expect(isBuildingVisible(state, 'laser')).toBe(false)
  })
})

describe('productionPerSecond', () => {
  it('multiplies drones by upgrades, dark matter and boost', () => {
    const state = buildState({
      buildings: { drone: 10 },
      upgrades: ['drone1'],
      darkMatter: 5,
      effects: { boostRemaining: 1 },
    })

    expect(productionPerSecond(state)).toBe(30)
  })
})

describe('clickValue', () => {
  it('multiplies click upgrades, dark matter and meteor shower', () => {
    const state = buildState({ upgrades: ['click1', 'click3'], darkMatter: 2, effects: { meteorRemaining: 5 } })

    expect(clickValue(state)).toBeCloseTo(72, 10)
  })
})

describe('netRates', () => {
  it('subtracts smelter consumption at the current efficiency', () => {
    const state = buildState({ buildings: { drone: 10, smelter: 5 }, efficiency: { smelter: 0.5, factory: 1 } })

    expect(netRates(state)).toEqual({ ore: 0, alloy: 2.5, chip: 0 })
  })
})
