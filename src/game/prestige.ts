import { hasShip } from './content/ship'
import { talentLevel } from './content/talents'
import { activateQuest } from './quests'
import { hasUpgrade } from './economy'
import { createInitialState, type GameState } from './types'

export const PRESTIGE_THRESHOLD = 10_000
export const PRESTIGE_BONUS_MULTIPLIER = 1.5
export const SPEEDRUN_MS = 30 * 60 * 1000

export const canPrestige = (state: GameState): boolean => state.stats.runChips >= PRESTIGE_THRESHOLD

export function coreDivisor(state: GameState): number {
  let divisor = 50
  if (hasUpgrade(state, 'singularity')) divisor *= 0.8
  if (state.artifact === 'darkSeed') divisor *= 0.7
  return divisor
}

export const coreMultiplier = (state: GameState): number =>
  1 + Math.sqrt(Math.max(0, state.stats.runCores) / coreDivisor(state))

export const darkMatterGain = (state: GameState): number =>
  Math.floor(Math.sqrt(state.stats.runChips / 1000) * coreMultiplier(state)) + talentLevel(state, 'darkVein')

export const bonusDarkMatterGain = (state: GameState): number =>
  Math.floor(darkMatterGain(state) * PRESTIGE_BONUS_MULTIPLIER)

export function applyPrestige(state: GameState, gain: number, now = 0): GameState {
  const fresh = createInitialState()
  const under30 =
    now > 0 && state.stats.runStartedAt > 0 && now - state.stats.runStartedAt <= SPEEDRUN_MS
  return activateQuest({
    ...fresh,
    resources: {
      ...fresh.resources,
      ore: hasShip(state, 'startCargo') ? 1000 : 0,
      alloy: hasShip(state, 'stasisStore') ? 200 : 0,
    },
    buildings: {
      ...fresh.buildings,
      drone:
        (hasShip(state, 'crewMemory') ? Math.min(state.buildings.drone, 10) : 0) +
        5 * talentLevel(state, 'startBoost'),
      smelter: hasShip(state, 'autoSmelter') ? 1 : 0,
      excavator: hasShip(state, 'autoSmelter') ? 1 : 0,
    },
    darkMatter: state.darkMatter + gain,
    achievements: state.achievements,
    prestigeCount: state.prestigeCount + 1,
    artifact: state.artifact,
    artifactsSeen: state.artifactsSeen,
    shipUpgrades: state.shipUpgrades,
    protocol: 'balance',
    stats: {
      ...fresh.stats,
      clicks: state.stats.clicks,
      totalProduced: { ...state.stats.totalProduced },
      adsWatched: state.stats.adsWatched,
      eventsSeen: state.stats.eventsSeen,
      meteorsCaught: state.stats.meteorsCaught,
      protocolSwitches: state.stats.protocolSwitches,
      offersDeclined: state.stats.offersDeclined,
      catsCaught: state.stats.catsCaught,
      discoCount: state.stats.discoCount,
      comboBest: state.stats.comboBest,
      discharges: state.stats.discharges,
      questsCompleted: state.stats.questsCompleted,
      nightOwl: state.stats.nightOwl,
      caughtCat: state.stats.caughtCat,
      discoUsed: state.stats.discoUsed,
      runStartedAt: now,
      totalPrestiges: state.stats.totalPrestiges + 1,
      expeditionsDone: state.stats.expeditionsDone,
      expeditionsFailed: state.stats.expeditionsFailed,
      prestigedWithoutExcavators: state.stats.prestigedWithoutExcavators || state.buildings.excavator === 0,
      prestigedUnder30Min: state.stats.prestigedUnder30Min || under30,
    },
    cooldowns: { ...state.cooldowns },
    shards: state.shards,
    galaxyCount: state.galaxyCount,
    talents: state.talents,
    challenge: state.challenge,
    challengesDone: state.challengesDone,
    expeditions: state.expeditions,
    autoPrestigeAt: state.autoPrestigeAt,
    theme: state.theme,
    asteroidSkin: state.asteroidSkin,
    tutorialDismissed: state.tutorialDismissed,
    tutorialSeen: state.tutorialSeen,
  }, state.quest.index)
}
