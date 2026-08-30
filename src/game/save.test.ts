import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { SaveError, applyOffline, decodeImport, deserialize, encodeExport, migrate, serialize } from './save'

const NOW = 1_700_000_000_000

describe('serialize / deserialize', () => {
  it('round-trips the state', () => {
    const state = buildState({
      resources: { ore: 12.5, alloy: 3, chip: 1 },
      darkMatter: 2,
      buildings: { drone: 7 },
      upgrades: ['click1'],
      achievements: ['clicks100'],
      cooldowns: { boostUntil: 42 },
    })

    const restored = deserialize(serialize(state, NOW))

    expect(restored).toEqual({ ...state, savedAt: NOW })
  })
})

describe('migrate', () => {
  it('migrates a v1 save to v2 with defaults', () => {
    const restored = migrate({ version: 1, resources: { ore: 10 }, buildings: { drone: 2 }, savedAt: 5 })

    expect(restored).toEqual(buildState({ resources: { ore: 10 }, buildings: { drone: 2 }, savedAt: 5 }))
    expect(restored.version).toBe(2)
    expect(restored.resources.core).toBe(0)
    expect(restored.protocol).toBe('balance')
    expect(restored.shipUpgrades).toEqual([])
  })

  it('drops unknown upgrade ids', () => {
    const restored = migrate({ version: 1, upgrades: ['click1', 'nope'] })

    expect(restored.upgrades).toEqual(['click1'])
  })

  it('rejects an unknown version', () => {
    expect(() => migrate({ version: 99 })).toThrow(SaveError)
  })

  it('rejects garbage', () => {
    expect(() => deserialize('{not json')).toThrow(SaveError)
  })
})

describe('export / import', () => {
  it('round-trips through base64', () => {
    const state = buildState({ resources: { ore: 777 }, darkMatter: 3 })

    const restored = decodeImport(encodeExport(state, NOW))

    expect(restored).toEqual({ ...state, savedAt: NOW })
  })

  it('rejects a string that is not base64 JSON', () => {
    expect(() => decodeImport('***')).toThrow(SaveError)
  })
})

describe('applyOffline', () => {
  it('simulates 8 hours in chunks', () => {
    const state = buildState({ buildings: { drone: 10 }, savedAt: NOW - 8 * 3600 * 1000 })

    const result = applyOffline(state, NOW)

    expect(result.elapsed).toBe(28_800)
    expect(result.state.resources.ore).toBe(144_000)
    expect(result.gains).toEqual({ ore: 144_000, alloy: 0, chip: 0, core: 0 })
  })

  it('caps 9 hours at 8', () => {
    const state = buildState({ buildings: { drone: 10 }, savedAt: NOW - 9 * 3600 * 1000 })

    const result = applyOffline(state, NOW)

    expect(result.elapsed).toBe(28_800)
    expect(result.state.resources.ore).toBe(144_000)
  })

  it('does nothing below 60 seconds', () => {
    const state = buildState({ buildings: { drone: 10 }, savedAt: NOW - 59_000 })

    const result = applyOffline(state, NOW)

    expect(result.elapsed).toBe(0)
    expect(result.state).toBe(state)
  })
})
