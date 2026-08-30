import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { QUEST_CHAIN, questAt } from './content/quests'
import { applyPrestige } from './prestige'
import { activateQuest, checkQuests, questProgress } from './quests'

describe('checkQuests', () => {
  it('activates the first quest lazily', () => {
    const result = checkQuests(buildState())

    expect(result.state.quest).toEqual({ index: 0, baseline: 0, goal: 50 })
    expect(result.completed).toEqual([])
  })

  it('completes the click quest and pays the reward', () => {
    const state = activateQuest(buildState(), 0)

    const result = checkQuests({ ...state, stats: { ...state.stats, clicks: 50 } })

    expect(result.completed).toEqual([{ name: 'Первые удары', rewardText: '+50 руды' }])
    expect(result.state.resources.ore).toBe(50)
    expect(result.state.quest.index).toBe(1)
    expect(result.state.stats.questsCompleted).toBe(1)
  })

  it('counts building quests from the activation baseline', () => {
    const state = activateQuest(buildState({ buildings: { drone: 3 }, stats: { clicks: 50 } }), 1)

    expect(questProgress({ ...state, buildings: { ...state.buildings, drone: 6 } }).current).toBe(3)
    expect(checkQuests({ ...state, buildings: { ...state.buildings, drone: 8 } }).completed).toHaveLength(1)
  })

  it('completes quests one by one against their baselines', () => {
    const start = checkQuests(buildState()).state
    const clicked = { ...start, stats: { ...start.stats, clicks: 60 } }

    const first = checkQuests(clicked)
    expect(first.completed.map((c) => c.name)).toEqual(['Первые удары'])
    expect(first.state.quest.index).toBe(1)

    const withDrones = { ...first.state, buildings: { ...first.state.buildings, drone: 5 } }
    const second = checkQuests(withDrones)
    expect(second.completed.map((c) => c.name)).toEqual(['Пять помощников'])
    expect(second.state.quest.index).toBe(2)
  })
})

describe('questAt', () => {
  it('cycles repeatable quests with doubled goals', () => {
    const first = questAt(QUEST_CHAIN.length)
    const looped = questAt(QUEST_CHAIN.length + 5)

    expect(first.def.id).toBe('clicksR')
    expect(first.scale).toBe(1)
    expect(looped.def.id).toBe('clicksR')
    expect(looped.scale).toBe(2)
  })
})

describe('quests across prestige', () => {
  it('re-baselines the active quest after the flight', () => {
    const state = activateQuest(buildState({ buildings: { drone: 3 }, stats: { runChips: 10_000 } }), 1)

    const after = applyPrestige(state, 3)

    expect(after.quest.index).toBe(1)
    expect(after.quest.baseline).toBe(0)
    expect(after.quest.goal).toBe(5)
  })
})

describe('absolute quests', () => {
  it('combo quest counts the best streak from zero, not from a baseline', () => {
    const state = activateQuest(buildState({ stats: { comboBest: 7 } }), 5)

    expect(state.quest.baseline).toBe(0)
    expect(questProgress(state).current).toBe(7)
    expect(checkQuests({ ...state, stats: { ...state.stats, comboBest: 10 } }).completed).toHaveLength(1)
  })
})

describe('stale save healing', () => {
  it('re-activates an absolute quest saved with a non-zero baseline', () => {
    const state = buildState({
      stats: { clicks: 999, comboBest: 8 },
      quest: { index: 5, baseline: 8, goal: 10 },
    })

    const healed = checkQuests(state).state

    expect(healed.quest.baseline).toBe(0)
    expect(questProgress(healed).current).toBe(8)
  })
})
