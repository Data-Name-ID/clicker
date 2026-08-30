import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { ARTIFACTS, pickArtifact } from './content/artifacts'
import { clickValue, costOf, productionPerSecond } from './economy'
import { applyBoost } from './rewards'

const NOW = 1_700_000_000_000

describe('pickArtifact', () => {
  it('picks from the unseen pool', () => {
    const next = pickArtifact(buildState({ artifactsSeen: ['cometShard'] }), 0)

    expect(next.artifact).toBe('iridiumVein')
    expect(next.artifactsSeen).toEqual(['cometShard', 'iridiumVein'])
  })

  it('resets the pool once everything was seen', () => {
    const next = pickArtifact(buildState({ artifactsSeen: ARTIFACTS.map((a) => a.id) }), 0)

    expect(next.artifact).toBe('cometShard')
    expect(next.artifactsSeen).toEqual(['cometShard'])
  })
})

describe('artifact effects', () => {
  it('comet shard triples the click', () => {
    expect(clickValue(buildState({ artifact: 'cometShard' }))).toBe(3)
  })

  it('iridium vein doubles drones', () => {
    expect(productionPerSecond(buildState({ artifact: 'iridiumVein', buildings: { drone: 10 } }))).toBe(10)
  })

  it('old blueprint discounts buildings by 20 %', () => {
    expect(costOf(buildState({ artifact: 'oldBlueprint' }), 'drone', 0, 1).ore).toBe(12)
  })

  it('rusty excavator boosts excavators and halves drones', () => {
    const state = buildState({ artifact: 'rustyExcavator', buildings: { drone: 10, excavator: 10 } })

    expect(productionPerSecond(state)).toBe(102.5)
  })

  it('hive adds 5 % per 10 drones', () => {
    expect(productionPerSecond(buildState({ artifact: 'hive', buildings: { drone: 20 } }))).toBeCloseTo(11, 10)
  })

  it('void seal boosts the passive dark matter bonus', () => {
    expect(clickValue(buildState({ artifact: 'voidSeal', darkMatter: 10 }))).toBe(2.5)
  })

  it('miner hammer multiplies only the first 100 run clicks', () => {
    expect(clickValue(buildState({ artifact: 'minerHammer' }))).toBe(10)
    expect(clickValue(buildState({ artifact: 'minerHammer', stats: { runClicks: 100 } }))).toBe(1)
  })

  it('smuggled booster halves ad cooldowns', () => {
    const next = applyBoost(buildState({ artifact: 'smuggledBooster' }), NOW)

    expect(next.cooldowns.boostUntil).toBe(NOW + 600_000 + 900_000)
  })
})
