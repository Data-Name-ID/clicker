import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { TUTORIAL_STEPS, dismissTutorial, markTutorialSeen, tutorialStep } from './tutorial'

describe('tutorialStep', () => {
  it('starts with clicking', () => {
    expect(tutorialStep(buildState())?.id).toBe('click')
  })

  it('shows click progress', () => {
    const state = buildState({ stats: { clicks: 4 } })

    expect(tutorialStep(state)?.progress?.(state)).toBe('4 / 10')
  })

  it('explains quests after 10 clicks, then sends to the drone', () => {
    expect(tutorialStep(buildState({ stats: { clicks: 10 } }))?.id).toBe('quests')
    expect(tutorialStep(buildState({ stats: { clicks: 10 }, tutorialSeen: ['quests'] }))?.id).toBe('drone')
  })

  it('skips the combo lesson until the player really clicks a lot', () => {
    const base = { stats: { clicks: 10 }, buildings: { drone: 1 }, tutorialSeen: ['quests' as const] }

    expect(tutorialStep(buildState(base))?.id).toBe('smelter')
    expect(tutorialStep(buildState({ ...base, stats: { clicks: 50 } }))?.id).toBe('combo')
  })

  it('holds the ads lesson until five drones are running', () => {
    const base = { stats: { clicks: 50 }, tutorialSeen: ['quests' as const, 'combo' as const] }

    expect(tutorialStep(buildState({ ...base, buildings: { drone: 4 } }))?.id).toBe('smelter')
    expect(tutorialStep(buildState({ ...base, buildings: { drone: 5 } }))?.id).toBe('ads')
  })

  it('explains events only after the first one happened', () => {
    const base = {
      stats: { clicks: 50 },
      buildings: { drone: 5, smelter: 1 },
      tutorialSeen: ['quests' as const, 'combo' as const, 'ads' as const, 'ore' as const],
    }

    expect(tutorialStep(buildState(base))?.id).toBe('factory')
    expect(tutorialStep(buildState({ ...base, stats: { clicks: 50, eventsSeen: 1 } }))?.id).toBe('events')
  })

  it('explains skills once the first level is earned', () => {
    const base = {
      stats: { clicks: 50, eventsSeen: 1 },
      buildings: { drone: 5, smelter: 1 },
      tutorialSeen: ['quests' as const, 'combo' as const, 'ads' as const, 'ore' as const, 'events' as const],
    }

    expect(tutorialStep(buildState(base))?.id).toBe('factory')
    expect(tutorialStep(buildState({ ...base, xp: 100 }))?.id).toBe('skills')
  })

  it('waits for ten drones before talking about expeditions', () => {
    const seen = ['quests', 'combo', 'ads', 'ore', 'events', 'skills', 'cores'] as const
    const base = {
      stats: { clicks: 50, peakResources: { chip: 500 } },
      buildings: { drone: 9, smelter: 1, factory: 1 },
      tutorialSeen: [...seen],
    }

    expect(tutorialStep(buildState(base))?.id).not.toBe('expeditions')
    expect(tutorialStep(buildState({ ...base, buildings: { drone: 10, smelter: 1, factory: 1 } }))?.id).toBe('expeditions')
  })

  it('mentions the flight only when chips start piling up', () => {
    const seen = ['quests', 'combo', 'ads', 'ore', 'events', 'skills', 'cores', 'expeditions', 'bonuses'] as const
    const base = {
      stats: { clicks: 50, peakResources: { chip: 500 } },
      buildings: { drone: 10, smelter: 1, factory: 1 },
      tutorialSeen: [...seen],
    }

    expect(tutorialStep(buildState(base))).toBeNull()
    expect(tutorialStep(buildState({ ...base, stats: { clicks: 50, runChips: 1000, peakResources: { chip: 500 } } }))?.id).toBe('prestige')
  })

  it('tells about the ship after the first flight and ends with the galaxy', () => {
    const seen = ['quests', 'combo', 'ads', 'ore', 'events', 'skills', 'cores', 'expeditions', 'bonuses'] as const
    const flown = buildState({
      prestigeCount: 2,
      stats: { clicks: 50 },
      buildings: { drone: 10, smelter: 1, factory: 1 },
      tutorialSeen: [...seen],
    })

    expect(tutorialStep(flown)?.id).toBe('shipInfo')
    expect(tutorialStep(markTutorialSeen(flown, 'shipInfo'))?.id).toBe('galaxyInfo')
    expect(TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id).toBe('galaxyInfo')
  })

  it('is hidden once dismissed', () => {
    expect(tutorialStep(dismissTutorial(buildState()))).toBeNull()
  })
})

describe('markTutorialSeen', () => {
  it('does not duplicate ids', () => {
    const state = markTutorialSeen(markTutorialSeen(buildState(), 'ads'), 'ads')

    expect(state.tutorialSeen).toEqual(['ads'])
  })
})
