import type { GameState, TalentId } from '../types'

export interface TalentDef {
  id: TalentId
  name: string
  description: string
  maxLevel: number
  cost: (level: number) => number
}

export const TALENTS: TalentDef[] = [
  { id: 'autoBuyer', name: 'Автопокупатель', description: 'Раз в секунду докупает самое дешёвое доступное здание (можно выключить)', maxLevel: 1, cost: () => 1 },
  { id: 'eternalProtocol', name: 'Вечный протокол', description: 'Протоколы ИИ доступны с самого начала забега', maxLevel: 1, cost: () => 1 },
  { id: 'startBoost', name: 'Стартовый рывок', description: '+5 дронов на старте каждого забега за уровень', maxLevel: 5, cost: () => 1 },
  { id: 'oreMemory', name: 'Память руды', description: '+25 % ко всей добыче за уровень, навсегда', maxLevel: 5, cost: () => 2 },
  { id: 'fastBoost', name: 'Быстрый разгон', description: 'Кулдаун «Перегрузки реактора» на 25 % короче', maxLevel: 1, cost: () => 2 },
  { id: 'expeditionCorps', name: 'Экспедиционный корпус', description: '+1 слот экспедиций за уровень', maxLevel: 3, cost: () => 2 },
  { id: 'autoEvents', name: 'Автособытия', description: 'Караван и чёрный рынок принимаются автоматически', maxLevel: 1, cost: () => 2 },
  { id: 'insurance', name: 'Страховка', description: 'Провал экспедиции больше не теряет дронов', maxLevel: 1, cost: () => 3 },
  { id: 'autoUpgrades', name: 'Автоулучшения', description: 'Доступные улучшения покупаются сами', maxLevel: 1, cost: () => 3 },
  { id: 'darkVein', name: 'Тёмная жила', description: '+1 тёмной материи к каждому перелёту за уровень', maxLevel: 3, cost: () => 4 },
  { id: 'shardResonance', name: 'Осколочный резонанс', description: '+10 % осколков за уровень', maxLevel: 3, cost: () => 5 },
  { id: 'autoPrestige', name: 'Автоперелёт', description: 'Перелёт совершается сам при награде не меньше заданной', maxLevel: 1, cost: () => 8 },
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
