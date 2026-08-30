import type { ChallengeId } from '../types'

export interface ChallengeDef {
  id: ChallengeId
  name: string
  description: string
  reward: number
  timeLimitMs?: number
}

export const CHALLENGES: ChallengeDef[] = [
  { id: 'silence', name: 'Тишина', description: 'Клик не добывает руду — только здания', reward: 2 },
  { id: 'blind', name: 'Слепота', description: 'Случайные события не происходят', reward: 2 },
  { id: 'ascetic', name: 'Аскеза', description: 'Рекламные бонусы недоступны', reward: 2 },
  { id: 'inflation', name: 'Инфляция', description: 'Здания дорожают на 30 % за штуку вместо 15 %', reward: 3 },
  { id: 'soloDrones', name: 'Соло-дроны', description: 'Доступны только буровые дроны', reward: 4 },
  { id: 'sprint', name: 'Спринт', description: 'Доберись до перелёта за 20 минут', reward: 4, timeLimitMs: 20 * 60 * 1000 },
]

export const challengeDef = (id: ChallengeId): ChallengeDef => CHALLENGES.find((c) => c.id === id)!
