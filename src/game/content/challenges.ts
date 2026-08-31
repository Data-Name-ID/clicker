import type { ChallengeId } from '../types'

export interface ChallengeDef {
  id: ChallengeId
  name: string
  description: string
  reward: number
  timeLimitMs?: number
}

export const CHALLENGES: ChallengeDef[] = [
  { id: 'silence', name: 'Тишина', description: 'Удар не добывает ничего — выкручивайся зданиями', reward: 2 },
  { id: 'blind', name: 'Слепота', description: 'Никаких событий: ни жил, ни комет', reward: 2 },
  { id: 'ascetic', name: 'Аскеза', description: 'Никакой рекламы и её бонусов', reward: 2 },
  { id: 'inflation', name: 'Инфляция', description: 'Каждое здание дорожает на 30 % вместо 15 %', reward: 3 },
  { id: 'soloDrones', name: 'Соло-дроны', description: 'Из зданий доступны только дроны', reward: 4 },
  { id: 'sprint', name: 'Спринт', description: 'Успей долететь за 20 минут', reward: 4, timeLimitMs: 20 * 60 * 1000 },
]

export const challengeDef = (id: ChallengeId): ChallengeDef => CHALLENGES.find((c) => c.id === id)!
