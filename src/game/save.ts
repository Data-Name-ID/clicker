import { ACHIEVEMENTS } from './content/achievements'
import { BUILDING_IDS } from './content/buildings'
import { UPGRADES } from './content/upgrades'
import { simulateChunked } from './tick'
import {
  createInitialState,
  type AchievementId,
  type GameState,
  type Resources,
  type UpgradeId,
} from './types'

export const SAVE_KEY = 'asteroid7:save'
export const SAVE_VERSION = 1
export const OFFLINE_MIN_SECONDS = 60
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60
export const OFFLINE_CHUNK_SECONDS = 60

type Raw = Record<string, unknown>

const migrations: Record<number, (raw: Raw) => Raw> = {}

export class SaveError extends Error {}

const isRecord = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback

const record = (v: unknown): Raw => (isRecord(v) ? v : {})

function resources(v: unknown, fallback: Resources): Resources {
  const r = record(v)
  return { ore: num(r.ore, fallback.ore), alloy: num(r.alloy, fallback.alloy), chip: num(r.chip, fallback.chip) }
}

function ids<T extends string>(v: unknown, known: readonly T[]): T[] {
  if (!Array.isArray(v)) return []
  const set = new Set<string>(known)
  return [...new Set(v.filter((x): x is T => typeof x === 'string' && set.has(x)))]
}

const UPGRADE_IDS: UpgradeId[] = UPGRADES.map((u) => u.id)
const ACHIEVEMENT_IDS: AchievementId[] = ACHIEVEMENTS.map((a) => a.id)

function normalize(raw: Raw): GameState {
  const base = createInitialState()
  const stats = record(raw.stats)
  const effects = record(raw.effects)
  const cooldowns = record(raw.cooldowns)
  const efficiency = record(raw.efficiency)
  const buildings = record(raw.buildings)
  return {
    version: SAVE_VERSION,
    resources: resources(raw.resources, base.resources),
    darkMatter: num(raw.darkMatter, 0),
    buildings: Object.fromEntries(
      BUILDING_IDS.map((id) => [id, Math.max(0, Math.floor(num(buildings[id], 0)))]),
    ) as GameState['buildings'],
    upgrades: ids(raw.upgrades, UPGRADE_IDS),
    achievements: ids(raw.achievements, ACHIEVEMENT_IDS),
    prestigeCount: Math.max(0, Math.floor(num(raw.prestigeCount, 0))),
    stats: {
      clicks: num(stats.clicks, 0),
      totalProduced: resources(stats.totalProduced, base.stats.totalProduced),
      runChips: num(stats.runChips, 0),
      adsWatched: num(stats.adsWatched, 0),
      smelterIdleSeconds: num(stats.smelterIdleSeconds, 0),
      peakResources: resources(stats.peakResources, base.stats.peakResources),
    },
    effects: {
      boostRemaining: Math.max(0, num(effects.boostRemaining, 0)),
      meteorRemaining: Math.max(0, num(effects.meteorRemaining, 0)),
    },
    cooldowns: {
      boostUntil: num(cooldowns.boostUntil, 0),
      supplyUntil: num(cooldowns.supplyUntil, 0),
      meteorUntil: num(cooldowns.meteorUntil, 0),
    },
    efficiency: {
      smelter: num(efficiency.smelter, 1),
      factory: num(efficiency.factory, 1),
    },
    tutorialDismissed: raw.tutorialDismissed === true,
    savedAt: num(raw.savedAt, 0),
  }
}

export function migrate(raw: unknown): GameState {
  if (!isRecord(raw)) throw new SaveError('Сохранение повреждено')
  let version = num(raw.version, 0)
  if (version < 1 || version > SAVE_VERSION) throw new SaveError(`Неизвестная версия сохранения: ${String(raw.version)}`)
  let current = raw
  while (version < SAVE_VERSION) {
    const step = migrations[version]
    if (!step) throw new SaveError(`Нет миграции с версии ${version}`)
    current = { ...step(current), version: version + 1 }
    version += 1
  }
  return normalize(current)
}

export const serialize = (state: GameState, savedAt: number): string =>
  JSON.stringify({ ...state, version: SAVE_VERSION, savedAt })

export function deserialize(json: string): GameState {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new SaveError('Сохранение повреждено')
  }
  return migrate(parsed)
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function base64ToBytes(text: string): Uint8Array {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export const encodeExport = (state: GameState, savedAt: number): string =>
  bytesToBase64(new TextEncoder().encode(serialize(state, savedAt)))

export function decodeImport(text: string): GameState {
  let json: string
  try {
    json = new TextDecoder().decode(base64ToBytes(text.trim()))
  } catch {
    throw new SaveError('Строка не похожа на экспорт')
  }
  return deserialize(json)
}

export interface OfflineResult {
  state: GameState
  elapsed: number
  gains: Resources
}

export function applyOffline(state: GameState, now: number): OfflineResult {
  const elapsed = Math.min(Math.max(0, (now - state.savedAt) / 1000), OFFLINE_CAP_SECONDS)
  if (elapsed < OFFLINE_MIN_SECONDS) {
    return { state, elapsed: 0, gains: { ore: 0, alloy: 0, chip: 0 } }
  }
  const next = simulateChunked(state, elapsed, OFFLINE_CHUNK_SECONDS)
  return {
    state: next,
    elapsed,
    gains: {
      ore: Math.max(0, next.resources.ore - state.resources.ore),
      alloy: Math.max(0, next.resources.alloy - state.resources.alloy),
      chip: Math.max(0, next.resources.chip - state.resources.chip),
    },
  }
}
