import { createInitialState, type GameState } from '../src/game/types'

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

export type StateOverrides = DeepPartial<GameState>

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function merge<T>(base: T, overrides: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(overrides)) return (overrides === undefined ? base : overrides) as T
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    result[key] = merge(result[key], value)
  }
  return result as T
}

export const buildState = (overrides: StateOverrides = {}): GameState =>
  merge(createInitialState(), overrides)
