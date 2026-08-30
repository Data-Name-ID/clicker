import type { AchievementId, GameState } from '../types'

export interface AchievementDef {
  id: AchievementId
  name: string
  description: string
  isEarned: (state: GameState) => boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'clicks100', name: 'Мозоль', description: '100 кликов', isEarned: (s) => s.stats.clicks >= 100 },
  { id: 'clicks1k', name: 'Рука-бур', description: '1 000 кликов', isEarned: (s) => s.stats.clicks >= 1_000 },
  { id: 'clicks10k', name: 'Кликер-легенда', description: '10 000 кликов', isEarned: (s) => s.stats.clicks >= 10_000 },
  { id: 'ore1k', name: 'Первая тонна', description: '1 000 руды за всё время', isEarned: (s) => s.stats.totalProduced.ore >= 1_000 },
  { id: 'ore1m', name: 'Рудная жила', description: '1 млн руды за всё время', isEarned: (s) => s.stats.totalProduced.ore >= 1_000_000 },
  { id: 'ore1b', name: 'Пояс астероидов', description: '1 млрд руды за всё время', isEarned: (s) => s.stats.totalProduced.ore >= 1_000_000_000 },
  { id: 'chips100', name: 'Первый кремний', description: '100 чипов за всё время', isEarned: (s) => s.stats.totalProduced.chip >= 100 },
  { id: 'chips10k', name: 'Микросхемный цех', description: '10 тыс чипов за всё время', isEarned: (s) => s.stats.totalProduced.chip >= 10_000 },
  { id: 'chips1m', name: 'Кремниевая долина', description: '1 млн чипов за всё время', isEarned: (s) => s.stats.totalProduced.chip >= 1_000_000 },
  { id: 'drones10', name: 'Эскадрилья', description: '10 дронов', isEarned: (s) => s.buildings.drone >= 10 },
  { id: 'drones50', name: 'Улей', description: '50 дронов', isEarned: (s) => s.buildings.drone >= 50 },
  { id: 'excavators10', name: 'Карьер', description: '10 экскаваторов', isEarned: (s) => s.buildings.excavator >= 10 },
  { id: 'excavators50', name: 'Разрез', description: '50 экскаваторов', isEarned: (s) => s.buildings.excavator >= 50 },
  { id: 'smelters10', name: 'Литейный двор', description: '10 плавилен', isEarned: (s) => s.buildings.smelter >= 10 },
  { id: 'smelters50', name: 'Металлургический комбинат', description: '50 плавилен', isEarned: (s) => s.buildings.smelter >= 50 },
  { id: 'factories10', name: 'Сборочная линия', description: '10 фабрик', isEarned: (s) => s.buildings.factory >= 10 },
  { id: 'factories50', name: 'Технопарк', description: '50 фабрик', isEarned: (s) => s.buildings.factory >= 50 },
  { id: 'lasers10', name: 'Орбитальная сеть', description: '10 лазеров', isEarned: (s) => s.buildings.laser >= 10 },
  { id: 'lasers50', name: 'Звезда смерти', description: '50 лазеров', isEarned: (s) => s.buildings.laser >= 50 },
  { id: 'prestige1', name: 'Перелётная птица', description: '1 перелёт', isEarned: (s) => s.prestigeCount >= 1 },
  { id: 'prestige5', name: 'Кочевник', description: '5 перелётов', isEarned: (s) => s.prestigeCount >= 5 },
  { id: 'idle', name: 'Простой', description: 'Плавильни на 0 % эффективности 60 с подряд', isEarned: (s) => s.stats.smelterIdleSeconds >= 60 },
  { id: 'watcher', name: 'Смотрящий', description: '10 просмотров рекламы', isEarned: (s) => s.stats.adsWatched >= 10 },
]

export const achievementDef = (id: AchievementId): AchievementDef => ACHIEVEMENTS.find((a) => a.id === id)!
