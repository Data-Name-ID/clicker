import { hasSkill, skillDef } from './content/skills'
import type { GameState, SkillId } from './types'

export const XP_BASE = 100
export const XP_GROWTH = 1.35

export const XP_REWARDS = {
  click: 1,
  building: 10,
  upgrade: 50,
  event: 25,
  meteor: 15,
  quest: 100,
  expedition: 100,
  discharge: 50,
  prestige: 500,
  galaxy: 2000,
} as const

export const xpForLevel = (level: number): number => XP_BASE * XP_GROWTH ** level

export function levelFromXp(xp: number): number {
  let level = 0
  let rest = xp
  let need = xpForLevel(0)
  while (rest >= need && level < 500) {
    rest -= need
    level += 1
    need = xpForLevel(level)
  }
  return level
}

export interface LevelProgress {
  level: number
  into: number
  need: number
}

export function levelProgress(xp: number): LevelProgress {
  let level = 0
  let rest = xp
  let need = xpForLevel(0)
  while (rest >= need && level < 500) {
    rest -= need
    level += 1
    need = xpForLevel(level)
  }
  return { level, into: rest, need }
}

export const skillPoints = (state: GameState): number =>
  Math.max(0, levelFromXp(state.xp) - state.skills.length)

export const addXp = (state: GameState, amount: number): GameState =>
  amount <= 0
    ? state
    : { ...state, xp: state.xp + amount * (hasSkill(state, 'dark1') ? 1.1 : 1) }

export function canLearnSkill(state: GameState, id: SkillId): boolean {
  if (state.skills.includes(id)) return false
  if (skillPoints(state) <= 0) return false
  return skillDef(id).requires.every((req) => state.skills.includes(req))
}

export function learnSkill(state: GameState, id: SkillId): GameState | null {
  if (!canLearnSkill(state, id)) return null
  return { ...state, skills: [...state.skills, id] }
}
