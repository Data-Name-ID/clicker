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
