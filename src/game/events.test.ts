import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import {
  acceptBlackMarket,
  acceptCaravan,
  addResources,
  catchComet,
  catchMeteor,
  catchStrayDrone,
  nextEventDelay,
  openCatBox,
  declineOffer,
  startRandomEvent,
  tickEvents,
  tickLive,
} from './events'

describe('tickEvents', () => {
  it('counts down without starting an event', () => {
    const state = buildState({ eventCountdown: 100 })

    const result = tickEvents(state, 10, [0, 0.5])

    expect(result.started).toBeNull()
    expect(result.state.eventCountdown).toBe(90)
  })

  it('starts an eligible event when the countdown expires', () => {
    const state = buildState({ eventCountdown: 5 })

    const result = tickEvents(state, 10, [0, 0.5])

    expect(result.started).toBe('goldVein')
    expect(result.state.effects.event).toEqual({ id: 'goldVein', remaining: 30 })
    expect(result.state.stats.eventsSeen).toBe(1)
    expect(result.state.eventCountdown).toBe(330)
  })

  it('does not start a second event while one is active', () => {
    const state = buildState({ eventCountdown: 0, effects: { event: { id: 'goldVein', remaining: 10 } } })

    const result = tickEvents(state, 10, [0, 0.5])

    expect(result.started).toBeNull()
    expect(result.state.effects.event).toEqual({ id: 'goldVein', remaining: 10 })
  })
})

describe('nextEventDelay', () => {
  it('is base plus spread', () => {
    expect(nextEventDelay(buildState(), 0.5)).toBe(330)
  })

  it('is shorter with the dark antenna', () => {
    expect(nextEventDelay(buildState({ shipUpgrades: ['darkAntenna'] }), 0.5)).toBe(220)
  })

  it('is halved with the lottery ticket', () => {
    expect(nextEventDelay(buildState({ artifact: 'lotteryTicket' }), 0.5)).toBe(165)
  })
})

describe('offers', () => {
  it('caravan trades half the ore for alloy at 0.6', () => {
    const state = buildState({ resources: { ore: 1000 }, effects: { event: { id: 'caravan', remaining: 10 } } })

    const next = acceptCaravan(state)

    expect(next.resources.ore).toBe(500)
    expect(next.resources.alloy).toBe(300)
    expect(next.effects.event).toBeNull()
  })

  it('black market trades half the alloy for chips at 0.22', () => {
    const state = buildState({ resources: { alloy: 1000 }, effects: { event: { id: 'blackMarket', remaining: 10 } } })

    const next = acceptBlackMarket(state)

    expect(next.resources.alloy).toBe(500)
    expect(next.resources.chip).toBe(110)
  })

  it('caravan does nothing without the event', () => {
    const state = buildState({ resources: { ore: 1000 } })

    expect(acceptCaravan(state)).toBe(state)
  })
})

describe('catches', () => {
  it('comet gives 10 minutes of ore production', () => {
    const state = buildState({ buildings: { drone: 10 }, effects: { event: { id: 'comet', remaining: 3 } } })

    const next = catchComet(state)

    expect(next.resources.ore).toBe(3000)
    expect(next.effects.event).toBeNull()
  })

  it('stray drone joins for free', () => {
    const state = buildState({ buildings: { drone: 5 }, effects: { event: { id: 'strayDrone', remaining: 3 } } })

    const next = catchStrayDrone(state)

    expect(next.buildings.drone).toBe(6)
    expect(next.stats.strayDrones).toBe(1)
  })

  it('meteor gives 30 seconds of production and counts', () => {
    const state = buildState({ buildings: { drone: 10 } })

    const next = catchMeteor(state)

    expect(next.resources.ore).toBe(150)
    expect(next.stats.meteorsCaught).toBe(1)
  })

  it('meteor refunds boost cooldown with the sling', () => {
    const state = buildState({ upgrades: ['sling'], cooldowns: { boostUntil: 1_000_000 } })

    expect(catchMeteor(state).cooldowns.boostUntil).toBe(990_000)
  })
})

describe('addResources', () => {
  it('updates totals, peaks and run counters', () => {
    const next = addResources(buildState(), { chip: 10, core: 5 })

    expect(next.resources.chip).toBe(10)
    expect(next.stats.runChips).toBe(10)
    expect(next.stats.runCores).toBe(5)
    expect(next.stats.peakResources.core).toBe(5)
  })

  it('does not count spending as production', () => {
    const next = addResources(buildState({ resources: { ore: 100 } }), { ore: -50 })

    expect(next.resources.ore).toBe(50)
    expect(next.stats.totalProduced.ore).toBe(0)
  })
})

describe('tickLive', () => {
  it('accumulates seconds without clicks', () => {
    expect(tickLive(buildState(), 5, 12).stats.noClickSeconds).toBe(5)
  })

  it('marks the night owl at 3 am', () => {
    expect(tickLive(buildState(), 1, 3).stats.nightOwl).toBe(true)
    expect(tickLive(buildState(), 1, 12).stats.nightOwl).toBe(false)
  })
})

describe('openCatBox', () => {
  it('gives ore on a low roll', () => {
    expect(openCatBox(buildState(), 0.2).delta.ore).toBe(50)
  })

  it('gives alloy on a middle roll', () => {
    expect(openCatBox(buildState(), 0.5).delta.alloy).toBe(20)
  })

  it('is empty on a high roll', () => {
    expect(openCatBox(buildState(), 0.9).delta).toEqual({})
  })
})

describe('startRandomEvent', () => {
  it('starts immediately when idle', () => {
    const result = startRandomEvent(buildState(), [0, 0.5])

    expect(result.started).toBe('goldVein')
    expect(result.state.effects.event).toEqual({ id: 'goldVein', remaining: 30 })
  })

  it('does nothing while an event is active', () => {
    const state = buildState({ effects: { event: { id: 'goldVein', remaining: 5 } } })

    expect(startRandomEvent(state, [0, 0.5]).started).toBeNull()
  })
})

describe('declineOffer', () => {
  it('counts declined offers', () => {
    const state = buildState({ effects: { event: { id: 'caravan', remaining: 5 } } })

    const next = declineOffer(state)

    expect(next.effects.event).toBeNull()
    expect(next.stats.offersDeclined).toBe(1)
  })

  it('does not count a non-offer event', () => {
    const state = buildState({ effects: { event: { id: 'goldVein', remaining: 5 } } })

    expect(declineOffer(state).stats.offersDeclined).toBe(0)
  })
})
