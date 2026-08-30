import type { AchievementId, GameState } from '../types'
import { ARTIFACTS } from './artifacts'
import { BUILDING_IDS } from './buildings'
import { SHIP_UPGRADES } from './ship'

export interface AchievementDef {
  id: AchievementId
  name: string
  description: string
  secret?: boolean
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
  { id: 'cores10', name: 'Первая мысль', description: '10 ИИ-ядер за всё время', isEarned: (s) => s.stats.totalProduced.core >= 10 },
  { id: 'cores1k', name: 'Коллективный разум', description: '1 000 ИИ-ядер за всё время', isEarned: (s) => s.stats.totalProduced.core >= 1_000 },
  { id: 'cores100k', name: 'Пробуждение', description: '100 тыс ИИ-ядер за всё время', isEarned: (s) => s.stats.totalProduced.core >= 100_000 },
  { id: 'neurolabs10', name: 'Вычислительный центр', description: '10 нейролабораторий', isEarned: (s) => s.buildings.neurolab >= 10 },
  { id: 'neurolabs50', name: 'Кремниевый мозг', description: '50 нейролабораторий', isEarned: (s) => s.buildings.neurolab >= 50 },
  { id: 'events10', name: 'Очевидец', description: '10 случайных событий', isEarned: (s) => s.stats.eventsSeen >= 10 },
  { id: 'events50', name: 'Магнит происшествий', description: '50 случайных событий', isEarned: (s) => s.stats.eventsSeen >= 50 },
  { id: 'meteors100', name: 'Ловец камней', description: '100 пойманных метеоров', isEarned: (s) => s.stats.meteorsCaught >= 100 },
  { id: 'protocols10', name: 'Тактик', description: '10 переключений протоколов', isEarned: (s) => s.stats.protocolSwitches >= 10 },
  { id: 'collector', name: 'Коллекционер', description: 'Увидеть все артефакты', isEarned: (s) => s.artifactsSeen.length >= ARTIFACTS.length },
  { id: 'quartermaster', name: 'Завхоз', description: 'Купить все улучшения корабля', isEarned: (s) => s.shipUpgrades.length >= SHIP_UPGRADES.length },
  { id: 'secretRage', name: 'Астероид недоволен', description: '100 кликов за 10 секунд', secret: true, isEarned: (s) => s.stats.clickBurstCount >= 100 },
  { id: 'secretJackpot', name: 'Джек-пот', description: 'Ровно 7 777 руды на счету', secret: true, isEarned: (s) => Math.floor(s.resources.ore) === 7_777 },
  { id: 'secretNight', name: 'Ночная смена', description: 'Играть в три часа ночи', secret: true, isEarned: (s) => s.stats.nightOwl },
  { id: 'secretCat', name: 'Мяу', description: 'Поймать байт-кота', secret: true, isEarned: (s) => s.stats.caughtCat },
  { id: 'secretDisco', name: 'Диско', description: 'Ввести известный код', secret: true, isEarned: (s) => s.stats.discoUsed },
  { id: 'secretAnswer', name: 'Ответ', description: 'Ровно 42 здания', secret: true, isEarned: (s) => BUILDING_IDS.reduce((sum, id) => sum + s.buildings[id], 0) === 42 },
  { id: 'secretMinimalist', name: 'Минималист', description: 'Перелёт без единого экскаватора', secret: true, isEarned: (s) => s.stats.prestigedWithoutExcavators },
  { id: 'secretHandsFree', name: 'Безрукий режим', description: '10 минут без кликов при открытой игре', secret: true, isEarned: (s) => s.stats.noClickSeconds >= 600 },
  { id: 'secretHoarder', name: 'Плюшкин', description: '100 000 руды на счету', secret: true, isEarned: (s) => s.resources.ore >= 100_000 },
  { id: 'secretSpeedrun', name: 'Спидраннер', description: 'Перелёт быстрее 30 минут', secret: true, isEarned: (s) => s.stats.prestigedUnder30Min },
]

export const achievementDef = (id: AchievementId): AchievementDef => ACHIEVEMENTS.find((a) => a.id === id)!
