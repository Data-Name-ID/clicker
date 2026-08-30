import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { applyPrestige, bonusDarkMatterGain, canPrestige, darkMatterGain } from './prestige'

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

    expect(after.resources).toEqual({ ore: 0, alloy: 0, chip: 0 })
    expect(after.buildings).toEqual({ drone: 0, excavator: 0, smelter: 0, factory: 0, laser: 0 })
    expect(after.upgrades).toEqual([])
    expect(after.effects).toEqual({ boostRemaining: 0, meteorRemaining: 0 })
    expect(after.stats.runChips).toBe(0)
  })

  it('keeps achievements, lifetime stats and cooldowns', () => {
    const after = applyPrestige(before, 3)

    expect(after.achievements).toEqual(['clicks100'])
    expect(after.stats.clicks).toBe(250)
    expect(after.stats.totalProduced).toEqual({ ore: 1e6, alloy: 5e4, chip: 2e4 })
    expect(after.stats.adsWatched).toBe(3)
    expect(after.cooldowns).toEqual({ boostUntil: 123, supplyUntil: 456, meteorUntil: 789 })
  })
})
