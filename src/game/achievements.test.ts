import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { grantAchievements, newAchievements } from './achievements'

describe('newAchievements', () => {
  it('reports every newly satisfied achievement', () => {
    const state = buildState({ stats: { clicks: 1000 }, buildings: { drone: 10 } })

    expect(newAchievements(state)).toEqual(['clicks100', 'clicks1k', 'drones10'])
  })

  it('does not report an achievement twice', () => {
    const state = grantAchievements(buildState({ stats: { clicks: 100 } }), ['clicks100'])

    expect(newAchievements(state)).toEqual([])
  })

  it('reports idle smelters after 60 seconds', () => {
    expect(newAchievements(buildState({ stats: { smelterIdleSeconds: 60 } }))).toEqual(['idle'])
  })
})

describe('secret achievements', () => {
  it('jackpot needs exactly 7 777 ore', () => {
    expect(newAchievements(buildState({ resources: { ore: 7777.5 } }))).toEqual(['secretJackpot'])
    expect(newAchievements(buildState({ resources: { ore: 7778 } }))).toEqual([])
  })

  it('the answer needs exactly 42 buildings', () => {
    expect(newAchievements(buildState({ buildings: { drone: 40, smelter: 2 } }))).toContain('secretAnswer')
  })

  it('rage needs 100 clicks inside the burst window', () => {
    expect(newAchievements(buildState({ stats: { clickBurstCount: 100 } }))).toContain('secretRage')
  })

  it('hands free needs 10 quiet minutes', () => {
    expect(newAchievements(buildState({ stats: { noClickSeconds: 600 } }))).toContain('secretHandsFree')
  })
})
