import { ACHIEVEMENTS } from './content/achievements'
import type { AchievementId, GameState } from './types'

export const newAchievements = (state: GameState): AchievementId[] =>
  ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && a.isEarned(state)).map((a) => a.id)

export const grantAchievements = (state: GameState, ids: AchievementId[]): GameState =>
  ids.length ? { ...state, achievements: [...state.achievements, ...ids] } : state
