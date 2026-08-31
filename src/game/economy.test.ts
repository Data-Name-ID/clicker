import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { applyClick, applyDischarge, buildingInfo, canAfford, darkMatterMultiplier, clickValue, costOf, isBuildingVisible, maxAffordable, netRates, productionPerSecond, performClick, processorRates, secondsUntilAffordable, setProtocol } from './economy'

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
  it('resonance adds a fifth of a second of producer output per click', () => {
    const next = applyClick(buildState({ upgrades: ['resonance'], buildings: { drone: 10 } }), 0)

    expect(next.resources.ore).toBeCloseTo(2.05, 10)
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

describe('milestones', () => {
  it('doubles a building at 25 owned', () => {
    expect(productionPerSecond(buildState({ buildings: { drone: 25 } }))).toBe(25)
  })

  it('stacks at 50 owned', () => {
    expect(productionPerSecond(buildState({ buildings: { drone: 50 } }))).toBe(100)
  })
})

describe('synergies', () => {
  it('excavators speed up smelters', () => {
    const state = buildState({ buildings: { smelter: 1, excavator: 10 } })

    expect(processorRates(state, 'smelter').input).toBeCloseTo(2.2, 10)
  })

  it('every building adds click power', () => {
    expect(clickValue(buildState({ buildings: { drone: 10 } }))).toBeCloseTo(1.05, 10)
  })
})

describe('combo and crits', () => {
  it('grows the combo inside the 2 second window', () => {
    const first = performClick(buildState(), 1000, 1)
    const second = performClick(first.state, 2500, 1)

    expect(second.combo).toBe(2)
    expect(second.gain).toBeCloseTo(1.01, 10)
  })

  it('resets the combo after a pause', () => {
    const first = performClick(buildState(), 1000, 1)
    const late = performClick(first.state, 4000, 1)

    expect(late.combo).toBe(1)
    expect(late.gain).toBe(1)
  })

  it('crits multiply the click by 10', () => {
    const result = performClick(buildState(), 0, 0.01)

    expect(result.crit).toBe(true)
    expect(result.gain).toBe(10)
  })

  it('the upgrade doubles the crit chance', () => {
    expect(performClick(buildState({ upgrades: ['crit1'] }), 0, 0.07).crit).toBe(true)
    expect(performClick(buildState(), 0, 0.07).crit).toBe(false)
  })
})

describe('discharge', () => {
  it('needs a full charge', () => {
    const state = buildState({ buildings: { drone: 10 }, charge: 99 })

    expect(applyDischarge(state)).toBe(state)
  })

  it('converts the charge into 60 seconds of production', () => {
    const state = buildState({ buildings: { drone: 10 }, charge: 100 })

    const next = applyDischarge(state)

    expect(next.resources.ore).toBe(300)
    expect(next.charge).toBe(0)
    expect(next.stats.discharges).toBe(1)
  })
})

describe('buildingInfo', () => {
  it('reports producer output with multipliers', () => {
    const info = buildingInfo(buildState({ buildings: { drone: 10 }, upgrades: ['drone1'] }), 'drone')

    expect(info.perUnit).toBe(1)
    expect(info.total).toBe(10)
  })

  it('reports processor input and output per unit', () => {
    const info = buildingInfo(buildState({ buildings: { smelter: 4 } }), 'smelter')

    expect(info.inputPerUnit).toBe(2)
    expect(info.outputPerUnit).toBe(1)
    expect(info.total).toBe(4)
  })
})

describe('secondsUntilAffordable', () => {
  it('estimates the wait from net rates', () => {
    const state = buildState({ buildings: { drone: 10 }, resources: { ore: 5 } })

    expect(secondsUntilAffordable(state, { ore: 15 })).toBe(2)
  })

  it('returns null when the rate is zero', () => {
    expect(secondsUntilAffordable(buildState(), { ore: 15 })).toBeNull()
  })

  it('returns 0 when already affordable', () => {
    expect(secondsUntilAffordable(buildState({ resources: { ore: 20 } }), { ore: 15 })).toBe(0)
  })
})

describe('dark matter soft cap', () => {
  it('is linear up to 100 dark matter', () => {
    expect(darkMatterMultiplier(buildState({ darkMatter: 100 }))).toBe(11)
  })

  it('grows as a square root beyond the cap', () => {
    expect(darkMatterMultiplier(buildState({ darkMatter: 400 }))).toBe(22)
    expect(darkMatterMultiplier(buildState({ darkMatter: 50_000 }))).toBeCloseTo(245.97, 1)
  })
})

describe('achievement bonus', () => {
  it('each achievement adds 2 % to all production', () => {
    const state = buildState({ buildings: { drone: 10 }, achievements: ['clicks100', 'ore1k'] })

    expect(productionPerSecond(state)).toBeCloseTo(5.2, 10)
  })
})
