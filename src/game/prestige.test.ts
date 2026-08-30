import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { applyPrestige, bonusDarkMatterGain, canPrestige, coreDivisor, darkMatterGain } from './prestige'

describe('canPrestige', () => {
  it('is unavailable at 9 999 chips', () => {
    expect(canPrestige(buildState({ stats: { runChips: 9_999 } }))).toBe(false)
  })

  it('is available at 10 000 chips', () => {
    expect(canPrestige(buildState({ stats: { runChips: 10_000 } }))).toBe(true)
  })
})

describe('darkMatterGain', () => {
  it('gives 3 dark matter for 10 000 chips', () => {
    expect(darkMatterGain(buildState({ stats: { runChips: 10_000 } }))).toBe(3)
  })

  it('gives 4 with the ad bonus', () => {
    expect(bonusDarkMatterGain(buildState({ stats: { runChips: 10_000 } }))).toBe(4)
  })
})

describe('applyPrestige', () => {
  const before = buildState({
    resources: { ore: 500, alloy: 20, chip: 12_000 },
    darkMatter: 1,
    buildings: { drone: 30, factory: 5 },
    upgrades: ['click1', 'drone1'],
    achievements: ['clicks100'],
    prestigeCount: 1,
    stats: { clicks: 250, totalProduced: { ore: 1e6, alloy: 5e4, chip: 2e4 }, runChips: 10_000, adsWatched: 3, smelterIdleSeconds: 10 },
    effects: { boostRemaining: 100, meteorRemaining: 5 },
    cooldowns: { boostUntil: 123, supplyUntil: 456, meteorUntil: 789 },
    savedAt: 1000,
  })

  it('adds dark matter and increments the counter', () => {
    const after = applyPrestige(before, 3)

    expect(after.darkMatter).toBe(4)
    expect(after.prestigeCount).toBe(2)
  })

  it('resets the run', () => {
    const after = applyPrestige(before, 3)

    expect(after.resources).toEqual({ ore: 0, alloy: 0, chip: 0, core: 0 })
    expect(after.buildings).toEqual({ drone: 0, excavator: 0, smelter: 0, factory: 0, laser: 0, neurolab: 0 })
    expect(after.upgrades).toEqual([])
    expect(after.effects).toEqual({ boostRemaining: 0, meteorRemaining: 0, event: null })
    expect(after.stats.runChips).toBe(0)
  })

  it('keeps achievements, lifetime stats and cooldowns', () => {
    const after = applyPrestige(before, 3)

    expect(after.achievements).toEqual(['clicks100'])
    expect(after.stats.clicks).toBe(250)
    expect(after.stats.totalProduced).toEqual({ ore: 1e6, alloy: 5e4, chip: 2e4, core: 0 })
    expect(after.stats.adsWatched).toBe(3)
    expect(after.cooldowns).toEqual({ boostUntil: 123, supplyUntil: 456, meteorUntil: 789, rerollUntil: 0, eventRushUntil: 0 })
  })
})

describe('core multiplier', () => {
  it('gives 6 dark matter for 10 000 chips and 50 cores', () => {
    expect(darkMatterGain(buildState({ stats: { runChips: 10_000, runCores: 50 } }))).toBe(6)
  })

  it('singularity lowers the divisor to 40', () => {
    const state = buildState({ upgrades: ['singularity'], stats: { runChips: 10_000, runCores: 50 } })

    expect(coreDivisor(state)).toBe(40)
    expect(darkMatterGain(state)).toBe(7)
  })

  it('dark seed lowers the divisor to 35', () => {
    expect(coreDivisor(buildState({ artifact: 'darkSeed' }))).toBeCloseTo(35, 10)
  })
})

describe('ship grants after prestige', () => {
  it('applies starting cargo, stasis, auto smelter and crew memory', () => {
    const state = buildState({
      stats: { runChips: 10_000 },
      buildings: { drone: 25 },
      shipUpgrades: ['startCargo', 'stasisStore', 'autoSmelter', 'crewMemory'],
    })

    const after = applyPrestige(state, 3)

    expect(after.resources.ore).toBe(1000)
    expect(after.resources.alloy).toBe(200)
    expect(after.buildings.drone).toBe(10)
    expect(after.buildings.smelter).toBe(1)
    expect(after.buildings.excavator).toBe(1)
    expect(after.shipUpgrades).toEqual(['startCargo', 'stasisStore', 'autoSmelter', 'crewMemory'])
  })
})

describe('prestige flags', () => {
  it('marks a run without excavators', () => {
    const after = applyPrestige(buildState({ stats: { runChips: 10_000 } }), 3)

    expect(after.stats.prestigedWithoutExcavators).toBe(true)
  })

  it('marks a run finished under 30 minutes', () => {
    const NOW = 1_700_000_000_000
    const state = buildState({ stats: { runChips: 10_000, runStartedAt: NOW - 20 * 60 * 1000 } })

    expect(applyPrestige(state, 3, NOW).stats.prestigedUnder30Min).toBe(true)
    expect(applyPrestige(buildState({ stats: { runChips: 10_000, runStartedAt: NOW - 40 * 60 * 1000 } }), 3, NOW).stats.prestigedUnder30Min).toBe(false)
  })
})

describe('customization after prestige', () => {
  it('keeps the theme and asteroid skin', () => {
    const state = buildState({ stats: { runChips: 10_000 }, theme: 'nebula', asteroidSkin: 2 })

    const after = applyPrestige(state, 3)

    expect(after.theme).toBe('nebula')
    expect(after.asteroidSkin).toBe(2)
  })
})
