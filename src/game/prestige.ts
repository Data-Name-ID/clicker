import { createInitialState, type GameState } from './types'

export const PRESTIGE_THRESHOLD = 10_000
export const PRESTIGE_BONUS_MULTIPLIER = 1.5

export const canPrestige = (state: GameState): boolean => state.stats.runChips >= PRESTIGE_THRESHOLD

export const darkMatterGain = (state: GameState): number =>
  Math.floor(Math.sqrt(state.stats.runChips / 1000))

export const bonusDarkMatterGain = (state: GameState): number =>
  Math.floor(darkMatterGain(state) * PRESTIGE_BONUS_MULTIPLIER)

export function applyPrestige(state: GameState, gain: number): GameState {
  const fresh = createInitialState()
  return {
    ...fresh,
    darkMatter: state.darkMatter + gain,
    achievements: state.achievements,
    prestigeCount: state.prestigeCount + 1,
    stats: {
      ...fresh.stats,
      clicks: state.stats.clicks,
      totalProduced: { ...state.stats.totalProduced },
      adsWatched: state.stats.adsWatched,
    },
    cooldowns: { ...state.cooldowns },
    tutorialDismissed: state.tutorialDismissed,
    savedAt: state.savedAt,
  }
}
