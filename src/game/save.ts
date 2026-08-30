import { ACHIEVEMENTS } from './content/achievements'
import { BUILDING_IDS } from './content/buildings'
import { UPGRADES } from './content/upgrades'
import { simulateChunked } from './tick'
import { ARTIFACTS } from './content/artifacts'
import { EVENTS } from './content/events'
import { SHIP_UPGRADES } from './content/ship'
import { hasShip } from './content/ship'
import {
  createInitialState,
  type AchievementId,
  type ArtifactId,
  type EventId,
  type GameState,
  type ProtocolId,
  type Resources,
  type ThemeId,
  type ShipUpgradeId,
  type TutorialStepId,
  type UpgradeId,
} from './types'

export const SAVE_KEY = 'asteroid7:save'
export const SAVE_VERSION = 3
export const OFFLINE_MIN_SECONDS = 60
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60
export const OFFLINE_CAP_EXTENDED_SECONDS = 24 * 60 * 60
export const DOUBLE_HOLD_MULTIPLIER = 1.5
export const OFFLINE_CHUNK_SECONDS = 60

type Raw = Record<string, unknown>

const migrations: Record<number, (raw: Raw) => Raw> = {
  1: (raw) => raw,
  2: (raw) => raw,
}

export class SaveError extends Error {}

const isRecord = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback

const record = (v: unknown): Raw => (isRecord(v) ? v : {})

function resources(v: unknown, fallback: Resources): Resources {
  const r = record(v)
  return {
    ore: num(r.ore, fallback.ore),
    alloy: num(r.alloy, fallback.alloy),
    chip: num(r.chip, fallback.chip),
    core: num(r.core, fallback.core),
  }
}

const bool = (v: unknown): boolean => v === true

function ids<T extends string>(v: unknown, known: readonly T[]): T[] {
  if (!Array.isArray(v)) return []
  const set = new Set<string>(known)
  return [...new Set(v.filter((x): x is T => typeof x === 'string' && set.has(x)))]
}

const UPGRADE_IDS: UpgradeId[] = UPGRADES.map((u) => u.id)
const ACHIEVEMENT_IDS: AchievementId[] = ACHIEVEMENTS.map((a) => a.id)
const TUTORIAL_STEP_IDS: TutorialStepId[] = ['click', 'drone', 'ads', 'smelter', 'ore', 'factory', 'cores', 'prestige']
const ARTIFACT_IDS: ArtifactId[] = ARTIFACTS.map((a) => a.id)
const SHIP_IDS: ShipUpgradeId[] = SHIP_UPGRADES.map((u) => u.id)
const EVENT_IDS: EventId[] = EVENTS.map((e) => e.id)
const PROTOCOLS: ProtocolId[] = ['balance', 'mining', 'factory']
const THEMES: ThemeId[] = ['classic', 'void', 'nebula', 'terminal']

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
      runClicks: num(stats.runClicks, 0),
      totalProduced: resources(stats.totalProduced, base.stats.totalProduced),
      runChips: num(stats.runChips, 0),
      runCores: num(stats.runCores, 0),
      adsWatched: num(stats.adsWatched, 0),
      smelterIdleSeconds: num(stats.smelterIdleSeconds, 0),
      peakResources: resources(stats.peakResources, base.stats.peakResources),
      eventsSeen: num(stats.eventsSeen, 0),
      meteorsCaught: num(stats.meteorsCaught, 0),
      protocolSwitches: num(stats.protocolSwitches, 0),
      strayDrones: num(stats.strayDrones, 0),
      noClickSeconds: num(stats.noClickSeconds, 0),
      clickBurstStart: num(stats.clickBurstStart, 0),
      clickBurstCount: num(stats.clickBurstCount, 0),
      runStartedAt: num(stats.runStartedAt, 0),
      prestigedWithoutExcavators: bool(stats.prestigedWithoutExcavators),
      prestigedUnder30Min: bool(stats.prestigedUnder30Min),
      nightOwl: bool(stats.nightOwl),
      caughtCat: bool(stats.caughtCat),
      discoUsed: bool(stats.discoUsed),
      offersDeclined: num(stats.offersDeclined, 0),
      catsCaught: num(stats.catsCaught, bool(stats.caughtCat) ? 1 : 0),
      discoCount: num(stats.discoCount, bool(stats.discoUsed) ? 1 : 0),
      comboBest: num(stats.comboBest, 0),
      discharges: num(stats.discharges, 0),
      questsCompleted: num(stats.questsCompleted, 0),
    },
    effects: {
      boostRemaining: Math.max(0, num(effects.boostRemaining, 0)),
      meteorRemaining: Math.max(0, num(effects.meteorRemaining, 0)),
      event: normalizeEvent(effects.event),
    },
    cooldowns: {
      boostUntil: num(cooldowns.boostUntil, 0),
      supplyUntil: num(cooldowns.supplyUntil, 0),
      meteorUntil: num(cooldowns.meteorUntil, 0),
      rerollUntil: num(cooldowns.rerollUntil, 0),
      eventRushUntil: num(cooldowns.eventRushUntil, 0),
    },
    efficiency: {
      smelter: num(efficiency.smelter, 1),
      factory: num(efficiency.factory, 1),
      neurolab: num(efficiency.neurolab, 1),
    },
    protocol: PROTOCOLS.includes(raw.protocol as ProtocolId) ? (raw.protocol as ProtocolId) : 'balance',
    artifact: ARTIFACT_IDS.includes(raw.artifact as ArtifactId) ? (raw.artifact as ArtifactId) : null,
    artifactsSeen: ids(raw.artifactsSeen, ARTIFACT_IDS),
    shipUpgrades: ids(raw.shipUpgrades, SHIP_IDS),
    eventCountdown: Math.max(0, num(raw.eventCountdown, 0)),
    catCountdown: Math.max(0, num(raw.catCountdown, 0)),
    combo: Math.max(0, num(raw.combo, 0)),
    lastClickAt: num(raw.lastClickAt, 0),
    charge: Math.min(100, Math.max(0, num(raw.charge, 0))),
    quest: normalizeQuest(raw.quest),
    theme: THEMES.includes(raw.theme as ThemeId) ? (raw.theme as ThemeId) : 'classic',
    asteroidSkin:
      typeof raw.asteroidSkin === 'number' && Number.isInteger(raw.asteroidSkin) && raw.asteroidSkin >= 0
        ? raw.asteroidSkin
        : null,
    tutorialDismissed: raw.tutorialDismissed === true,
    tutorialSeen: ids(raw.tutorialSeen, TUTORIAL_STEP_IDS),
    savedAt: num(raw.savedAt, 0),
  }
}

function normalizeQuest(v: unknown): GameState['quest'] {
  const q = record(v)
  return {
    index: Math.max(0, Math.floor(num(q.index, 0))),
    baseline: num(q.baseline, 0),
    goal: Math.max(0, num(q.goal, 0)),
  }
}

function normalizeEvent(v: unknown): GameState['effects']['event'] {
  if (!isRecord(v)) return null
  const remaining = num(v.remaining, 0)
  if (remaining <= 0 || !EVENT_IDS.includes(v.id as EventId)) return null
  return { id: v.id as EventId, remaining }
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
  const cap = hasShip(state, 'cargoBay') ? OFFLINE_CAP_EXTENDED_SECONDS : OFFLINE_CAP_SECONDS
  const elapsed = Math.min(Math.max(0, (now - state.savedAt) / 1000), cap)
  if (elapsed < OFFLINE_MIN_SECONDS) {
    return { state, elapsed: 0, gains: { ore: 0, alloy: 0, chip: 0, core: 0 } }
  }
  let next = simulateChunked(state, elapsed, OFFLINE_CHUNK_SECONDS)
  let gains: Resources = {
    ore: Math.max(0, next.resources.ore - state.resources.ore),
    alloy: Math.max(0, next.resources.alloy - state.resources.alloy),
    chip: Math.max(0, next.resources.chip - state.resources.chip),
    core: Math.max(0, next.resources.core - state.resources.core),
  }
  if (hasShip(state, 'doubleHold')) {
    const extra = DOUBLE_HOLD_MULTIPLIER - 1
    next = {
      ...next,
      resources: {
        ore: next.resources.ore + gains.ore * extra,
        alloy: next.resources.alloy + gains.alloy * extra,
        chip: next.resources.chip + gains.chip * extra,
        core: next.resources.core + gains.core * extra,
      },
    }
    gains = {
      ore: gains.ore * DOUBLE_HOLD_MULTIPLIER,
      alloy: gains.alloy * DOUBLE_HOLD_MULTIPLIER,
      chip: gains.chip * DOUBLE_HOLD_MULTIPLIER,
      core: gains.core * DOUBLE_HOLD_MULTIPLIER,
    }
  }
  return { state: next, elapsed, gains }
}
