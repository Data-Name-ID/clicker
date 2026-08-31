import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { productionPerSecond } from './economy'
import {
  busyDrones,
  canStartExpedition,
  collectExpedition,
  maxExpeditionSlots,
  startExpedition,
} from './expeditions'

const NOW = 1_700_000_000_000

describe('startExpedition', () => {
  it('sends drones away for the duration', () => {
    const state = buildState({ buildings: { drone: 30 } })

    const next = startExpedition(state, 'short', 10, NOW)!

    expect(next.expeditions).toEqual([{ kind: 'short', drones: 10, endsAt: NOW + 900_000 }])
    expect(busyDrones(next)).toBe(10)
  })

  it('busy drones stop producing', () => {
    const state = startExpedition(buildState({ buildings: { drone: 30 } }), 'short', 10, NOW)!

    expect(productionPerSecond(state)).toBe(20)
  })

  it('rejects more drones than available', () => {
    const state = startExpedition(buildState({ buildings: { drone: 30 } }), 'short', 25, NOW)!

    expect(startExpedition(state, 'short', 10, NOW)).toBeNull()
  })

  it('slots grow with the talent', () => {
    expect(maxExpeditionSlots(buildState())).toBe(1)
    expect(maxExpeditionSlots(buildState({ talents: { expeditionCorps: 3 } }))).toBe(4)
    expect(canStartExpedition(buildState({ buildings: { drone: 100 }, expeditions: [{ kind: 'short', drones: 10, endsAt: 1 }] }), 'short', 10)).toBe(false)
  })
})

describe('collectExpedition', () => {
  const ready = buildState({
    buildings: { drone: 30 },
    expeditions: [{ kind: 'short', drones: 10, endsAt: NOW - 1 }],
  })

  it('is not collectable before the timer', () => {
    const early = buildState({ expeditions: [{ kind: 'short', drones: 10, endsAt: NOW + 5000 }] })

    expect(collectExpedition(early, 0, NOW, [0.5, 0.5])).toBeNull()
  })

  it('pays ore and alloy on a normal outcome', () => {
    const result = collectExpedition(ready, 0, NOW, [0.9, 0.9])!

    expect(result.outcome).toBe('normal')
    expect(result.state.resources.ore).toBe(9000)
    expect(result.state.resources.alloy).toBe(900)
    expect(result.state.stats.expeditionsDone).toBe(1)
    expect(result.state.expeditions).toEqual([])
  })

  it('rare outcome adds chips, cores and sometimes dark matter', () => {
    const result = collectExpedition(ready, 0, NOW, [0.2, 0.1])!

    expect(result.outcome).toBe('rare')
    expect(result.state.resources.chip).toBe(180)
    expect(result.darkMatter).toBe(1)
    expect(result.state.darkMatter).toBe(1)
  })

  it('failure loses half the drones', () => {
    const result = collectExpedition(ready, 0, NOW, [0.1, 0.9])!

    expect(result.outcome).toBe('fail')
    expect(result.lostDrones).toBe(5)
    expect(result.state.buildings.drone).toBe(25)
    expect(result.state.stats.expeditionsFailed).toBe(1)
  })

  it('insurance saves the drones', () => {
    const insured = { ...ready, talents: { insurance: 1 } }

    const result = collectExpedition(insured, 0, NOW, [0.1, 0.9])!

    expect(result.lostDrones).toBe(0)
    expect(result.state.buildings.drone).toBe(30)
  })
})
