import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { dismissTutorial, markTutorialSeen, tutorialStep } from './tutorial'

describe('tutorialStep', () => {
  it('starts with clicking', () => {
    expect(tutorialStep(buildState())?.id).toBe('click')
  })

  it('shows click progress', () => {
    const state = buildState({ stats: { clicks: 4 } })

    expect(tutorialStep(state)?.progress?.(state)).toBe('4 / 10')
  })

  it('moves to the drone step after 10 clicks', () => {
    expect(tutorialStep(buildState({ stats: { clicks: 10 } }))?.id).toBe('drone')
  })

  it('explains ads once the first drone is bought', () => {
    expect(tutorialStep(buildState({ stats: { clicks: 10 }, buildings: { drone: 1 } }))?.id).toBe('ads')
  })

  it('moves on from the ads step once it was seen', () => {
    const state = markTutorialSeen(buildState({ stats: { clicks: 10 }, buildings: { drone: 1 } }), 'ads')

    expect(tutorialStep(state)?.id).toBe('smelter')
  })

  it('explains ore consumption right after the first smelter', () => {
    const state = buildState({ stats: { clicks: 10 }, buildings: { drone: 1, smelter: 1 }, tutorialSeen: ['ads'] })

    expect(tutorialStep(state)?.id).toBe('ore')
  })

  it('skips finished steps', () => {
    const state = buildState({ stats: { clicks: 10 }, buildings: { drone: 1, smelter: 1 }, tutorialSeen: ['ads', 'ore'] })

    expect(tutorialStep(state)?.id).toBe('factory')
  })

  it('ends after the first prestige', () => {
    const state = buildState({ stats: { clicks: 10 }, buildings: { drone: 1, smelter: 1, factory: 1 }, prestigeCount: 1, tutorialSeen: ['ads', 'ore', 'cores'] })

    expect(tutorialStep(state)).toBeNull()
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
