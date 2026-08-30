import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { dismissTutorial, tutorialStep } from './tutorial'

describe('tutorialStep', () => {
  it('starts with clicking', () => {
    expect(tutorialStep(buildState())?.id).toBe('click')
  })

  it('shows click progress', () => {
    expect(tutorialStep(buildState({ stats: { clicks: 4 } }))?.progress?.(buildState({ stats: { clicks: 4 } }))).toBe('4 / 10')
  })

  it('moves to the drone step after 10 clicks', () => {
    expect(tutorialStep(buildState({ stats: { clicks: 10 } }))?.id).toBe('drone')
  })

  it('skips finished steps', () => {
    const state = buildState({ stats: { clicks: 10 }, buildings: { drone: 1, smelter: 1 } })

    expect(tutorialStep(state)?.id).toBe('factory')
  })

  it('ends after the first prestige', () => {
    const state = buildState({ stats: { clicks: 10 }, buildings: { drone: 1, smelter: 1, factory: 1 }, prestigeCount: 1 })

    expect(tutorialStep(state)).toBeNull()
  })

  it('is hidden once dismissed', () => {
    expect(tutorialStep(dismissTutorial(buildState()))).toBeNull()
  })
})
