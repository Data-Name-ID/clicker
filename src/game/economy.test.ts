import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { applyClick, canAfford, clickValue, costOf, isBuildingVisible, maxAffordable, netRates, productionPerSecond, processorRates, setProtocol } from './economy'

describe('costOf', () => {
  it('prices 10 drones with none owned', () => {
    expect(costOf(buildState(), 'drone', 0, 10).ore).toBeCloseTo(304.56, 2)
  })

  it('prices 10 drones with 5 already owned', () => {
    expect(costOf(buildState(), 'drone', 5, 10).ore).toBeCloseTo(612.57, 2)
  })

  it('prices a laser in both currencies', () => {
    expect(costOf(buildState(), 'laser', 0, 1)).toEqual({ alloy: 3000, chip: 100 })
  })
})

describe('maxAffordable', () => {
  it('returns how many drones fit into the budget', () => {
    expect(maxAffordable(buildState(), 'drone', 0, { ore: 304.56, alloy: 0, chip: 0, core: 0 })).toBe(10)
  })

  it('returns 0 when the first unit is too expensive', () => {
    expect(maxAffordable(buildState(), 'drone', 0, { ore: 14, alloy: 0, chip: 0, core: 0 })).toBe(0)
  })

  it('is limited by the scarcest currency', () => {
    expect(maxAffordable(buildState(), 'laser', 0, { ore: 0, alloy: 1_000_000, chip: 215, core: 0 })).toBe(2)
  })
})

describe('canAfford', () => {
  it('rejects a cost above the balance', () => {
    expect(canAfford({ ore: 10, alloy: 0, chip: 0, core: 0 }, { ore: 15 })).toBe(false)
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

  it('shows tutorial buildings right away while the tutorial is active', () => {
    const state = buildState()

    expect(isBuildingVisible(state, 'drone')).toBe(true)
    expect(isBuildingVisible(state, 'smelter')).toBe(true)
    expect(isBuildingVisible(state, 'factory')).toBe(true)
    expect(isBuildingVisible(state, 'excavator')).toBe(false)
  })

  it('applies the price rule once the tutorial is dismissed', () => {
    const state = buildState({ tutorialDismissed: true })

    expect(isBuildingVisible(state, 'factory')).toBe(false)
  })

  it('always shows an owned building', () => {
    const state = buildState({ tutorialDismissed: true, buildings: { laser: 1 } })

    expect(isBuildingVisible(state, 'laser')).toBe(true)
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

    expect(netRates(state)).toEqual({ ore: 0, alloy: 2.5, chip: 0, core: 0 })
  })
})

describe('crowd effect', () => {
  it('multiplies every 10th click by 10', () => {
    expect(clickValue(buildState({ upgrades: ['crowd'], stats: { clicks: 9 } }))).toBe(10)
    expect(clickValue(buildState({ upgrades: ['crowd'], stats: { clicks: 10 } }))).toBe(1)
  })
})

describe('protocols', () => {
  it('mining protocol boosts producers and slows processors', () => {
    const state = buildState({ protocol: 'mining', buildings: { drone: 10, smelter: 5 } })

    expect(productionPerSecond(state)).toBe(7.5)
    expect(processorRates(state, 'smelter').input).toBe(7.5)
  })

  it('setProtocol requires the upgrade and counts switches', () => {
    const locked = buildState()
    expect(setProtocol(locked, 'mining')).toBe(locked)

    const next = setProtocol(buildState({ upgrades: ['protocols'] }), 'mining')
    expect(next.protocol).toBe('mining')
    expect(next.stats.protocolSwitches).toBe(1)
  })
})

describe('applyClick extras', () => {
  it('resonance adds one second of producer output per click', () => {
    const next = applyClick(buildState({ upgrades: ['resonance'], buildings: { drone: 10 } }), 0)

    expect(next.resources.ore).toBe(6)
  })

  it('tracks the click burst window', () => {
    const first = applyClick(buildState(), 1000)
    const second = applyClick(first, 5000)
    const third = applyClick(second, 20_000)

    expect(second.stats.clickBurstCount).toBe(2)
    expect(third.stats.clickBurstCount).toBe(1)
    expect(third.stats.clickBurstStart).toBe(20_000)
  })
})
