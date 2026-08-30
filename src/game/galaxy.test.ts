import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import {
  applyGalaxyReset,
  canGalaxyReset,
  challengeOutcomeOnPrestige,
  exitChallenge,
  settleChallenge,
  shardsGain,
  startChallenge,
} from './galaxy'
import { buyTalent } from './content/talents'

const NOW = 1_700_000_000_000

describe('canGalaxyReset', () => {
  it('needs 5 prestiges and 100 dark matter', () => {
    expect(canGalaxyReset(buildState({ prestigeCount: 5, darkMatter: 100 }))).toBe(true)
    expect(canGalaxyReset(buildState({ prestigeCount: 4, darkMatter: 500 }))).toBe(false)
    expect(canGalaxyReset(buildState({ prestigeCount: 9, darkMatter: 99 }))).toBe(false)
  })
})

describe('shardsGain', () => {
  it('gives 3 shards for 100 dark matter', () => {
    expect(shardsGain(buildState({ darkMatter: 100 }))).toBe(3)
  })

  it('resonance talent adds 10 % per level', () => {
    expect(shardsGain(buildState({ darkMatter: 1000, talents: { shardResonance: 3 } }))).toBe(13)
  })
})

describe('applyGalaxyReset', () => {
  const before = buildState({
    prestigeCount: 6,
    darkMatter: 100,
    resources: { ore: 5000, chip: 100 },
    buildings: { drone: 40, laser: 3 },
    upgrades: ['click1'],
    artifact: 'hive',
    artifactsSeen: ['hive', 'cometShard'],
    shipUpgrades: ['startCargo'],
    achievements: ['clicks100'],
    talents: { oreMemory: 2 },
    shards: 1,
    stats: { totalPrestiges: 6, clicks: 500 },
  })

  it('burns the run and dark matter for shards', () => {
    const after = applyGalaxyReset(before, NOW)

    expect(after.shards).toBe(4)
    expect(after.galaxyCount).toBe(1)
    expect(after.darkMatter).toBe(0)
    expect(after.prestigeCount).toBe(0)
    expect(after.upgrades).toEqual([])
    expect(after.artifact).toBeNull()
    expect(after.artifactsSeen).toEqual([])
    expect(after.resources.ore).toBe(1000)
  })

  it('keeps the ship, achievements, talents and lifetime stats', () => {
    const after = applyGalaxyReset(before, NOW)

    expect(after.shipUpgrades).toEqual(['startCargo'])
    expect(after.achievements).toEqual(['clicks100'])
    expect(after.talents).toEqual({ oreMemory: 2 })
    expect(after.stats.totalPrestiges).toBe(6)
    expect(after.stats.clicks).toBe(500)
  })
})

describe('challenges', () => {
  it('start resets the run without ship grants', () => {
    const state = buildState({ resources: { ore: 999 }, buildings: { drone: 30 }, shipUpgrades: ['startCargo'] })

    const inChallenge = startChallenge(state, 'silence', NOW)

    expect(inChallenge.challenge).toEqual({ id: 'silence', startedAt: NOW })
    expect(inChallenge.resources.ore).toBe(0)
    expect(inChallenge.buildings.drone).toBe(0)
  })

  it('exit resets the run with ship grants back', () => {
    const state = startChallenge(buildState({ shipUpgrades: ['startCargo'] }), 'silence', NOW)

    const out = exitChallenge(state, NOW + 1000)

    expect(out.challenge).toBeNull()
    expect(out.resources.ore).toBe(1000)
  })

  it('first completion pays shards, repeat does not', () => {
    const state = startChallenge(buildState(), 'silence', NOW)

    const outcome = challengeOutcomeOnPrestige(state, NOW + 60_000)!
    expect(outcome).toEqual({ id: 'silence', name: 'Тишина', success: true, shards: 2 })

    const settled = settleChallenge(state, outcome)
    expect(settled.shards).toBe(2)
    expect(settled.challengesDone).toEqual(['silence'])

    const again = challengeOutcomeOnPrestige({ ...settled, challenge: { id: 'silence', startedAt: NOW } }, NOW + 1)!
    expect(again.shards).toBe(0)
  })

  it('sprint fails after 20 minutes', () => {
    const state = startChallenge(buildState(), 'sprint', NOW)

    const outcome = challengeOutcomeOnPrestige(state, NOW + 21 * 60 * 1000)!

    expect(outcome.success).toBe(false)
    expect(outcome.shards).toBe(0)
  })
})

describe('buyTalent', () => {
  it('spends shards and levels up', () => {
    const next = buyTalent(buildState({ shards: 3 }), 'oreMemory')!

    expect(next.shards).toBe(1)
    expect(next.talents.oreMemory).toBe(1)
  })

  it('respects the level cap and the price', () => {
    expect(buyTalent(buildState({ shards: 10, talents: { autoBuyer: 1 } }), 'autoBuyer')).toBeNull()
    expect(buyTalent(buildState({ shards: 0 }), 'autoBuyer')).toBeNull()
  })
})
