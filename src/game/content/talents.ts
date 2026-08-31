import type { GameState, TalentId } from '../types'

export interface TalentDef {
  id: TalentId
  name: string
  description: string
  maxLevel: number
  cost: (level: number) => number
}

export const TALENTS: TalentDef[] = [
  { id: 'autoBuyer', name: 'Автопокупатель', description: 'Сам докупает самое дешёвое здание раз в секунду', maxLevel: 1, cost: () => 1 },
  { id: 'eternalProtocol', name: 'Вечный протокол', description: 'Режимы базы доступны с первой секунды забега', maxLevel: 1, cost: () => 1 },
  { id: 'startBoost', name: 'Стартовый рывок', description: 'Забег начинается с пятью дронами за уровень', maxLevel: 5, cost: () => 1 },
  { id: 'oreMemory', name: 'Память руды', description: 'Вся добыча +25 % за уровень — навсегда', maxLevel: 5, cost: () => 2 },
  { id: 'fastBoost', name: 'Быстрый разгон', description: 'Перегрузка перезаряжается на четверть быстрее', maxLevel: 1, cost: () => 2 },
  { id: 'expeditionCorps', name: 'Экспедиционный корпус', description: 'Ещё один отряд в рейде за уровень', maxLevel: 3, cost: () => 2 },
  { id: 'autoEvents', name: 'Автособытия', description: 'Выгодные обмены принимаются без тебя', maxLevel: 1, cost: () => 2 },
  { id: 'insurance', name: 'Страховка', description: 'Из провального рейда возвращаются все дроны', maxLevel: 1, cost: () => 3 },
  { id: 'autoUpgrades', name: 'Автоулучшения', description: 'Улучшения покупаются сами, как только по карману', maxLevel: 1, cost: () => 3 },
  { id: 'darkVein', name: 'Тёмная жила', description: 'Каждый перелёт приносит на единицу материи больше', maxLevel: 3, cost: () => 4 },
  { id: 'shardResonance', name: 'Осколочный резонанс', description: 'Осколков с прыжка на 10 % больше за уровень', maxLevel: 3, cost: () => 5 },
  { id: 'autoPrestige', name: 'Автоперелёт', description: 'Улетает сам, когда награда дорастёт до твоей планки', maxLevel: 1, cost: () => 8 },
]

export const talentDef = (id: TalentId): TalentDef => TALENTS.find((t) => t.id === id)!

export const talentLevel = (state: GameState, id: TalentId): number => state.talents[id] ?? 0

export function buyTalent(state: GameState, id: TalentId): GameState | null {
  const def = talentDef(id)
  const level = talentLevel(state, id)
  if (level >= def.maxLevel) return null
  const cost = def.cost(level)
  if (state.shards < cost) return null
  return {
    ...state,
    shards: state.shards - cost,
    talents: { ...state.talents, [id]: level + 1 },
  }
}
