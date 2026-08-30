import type { Cost, GameState, UpgradeId } from '../types'

export type UpgradeEffect =
  | { target: 'click'; multiplier: number }
  | { target: 'drone' | 'excavator' | 'laser'; multiplier: number }
  | { target: 'smelter' | 'factory'; input: number; output: number }
  | { target: 'global'; multiplier: number }

export interface UpgradeDef {
  id: UpgradeId
  name: string
  description: string
  effect: UpgradeEffect
  cost: Cost
  requirement: string
  isUnlocked: (state: GameState) => boolean
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'click1',
    name: 'Алмазные буры',
    description: 'Клик ×2',
    effect: { target: 'click', multiplier: 2 },
    cost: { ore: 50 },
    requirement: 'добыто 100 руды',
    isUnlocked: (s) => s.stats.totalProduced.ore >= 100,
  },
  {
    id: 'click2',
    name: 'Плазменный резак',
    description: 'Клик ×2',
    effect: { target: 'click', multiplier: 2 },
    cost: { ore: 500 },
    requirement: '10 дронов',
    isUnlocked: (s) => s.buildings.drone >= 10,
  },
  {
    id: 'drone1',
    name: 'Автопилот дронов',
    description: 'Дроны ×2',
    effect: { target: 'drone', multiplier: 2 },
    cost: { ore: 500 },
    requirement: '10 дронов',
    isUnlocked: (s) => s.buildings.drone >= 10,
  },
  {
    id: 'excavator1',
    name: 'Титановые ковши',
    description: 'Экскаваторы ×2',
    effect: { target: 'excavator', multiplier: 2 },
    cost: { ore: 2000 },
    requirement: '10 экскаваторов',
    isUnlocked: (s) => s.buildings.excavator >= 10,
  },
  {
    id: 'drone2',
    name: 'Рой дронов',
    description: 'Дроны ×2',
    effect: { target: 'drone', multiplier: 2 },
    cost: { alloy: 200 },
    requirement: '25 дронов',
    isUnlocked: (s) => s.buildings.drone >= 25,
  },
  {
    id: 'smelter1',
    name: 'Плазменная печь',
    description: 'Плавильни: вход и выход ×2',
    effect: { target: 'smelter', input: 2, output: 2 },
    cost: { alloy: 300 },
    requirement: '10 плавилен',
    isUnlocked: (s) => s.buildings.smelter >= 10,
  },
  {
    id: 'excavator2',
    name: 'Автономные экскаваторы',
    description: 'Экскаваторы ×2',
    effect: { target: 'excavator', multiplier: 2 },
    cost: { alloy: 1000 },
    requirement: '25 экскаваторов',
    isUnlocked: (s) => s.buildings.excavator >= 25,
  },
  {
    id: 'smelter2',
    name: 'Катализатор',
    description: 'Плавильни: выход ×1,5 при том же входе',
    effect: { target: 'smelter', input: 1, output: 1.5 },
    cost: { chip: 50 },
    requirement: '25 плавилен',
    isUnlocked: (s) => s.buildings.smelter >= 25,
  },
  {
    id: 'drone3',
    name: 'Дроны-репликаторы',
    description: 'Дроны ×2',
    effect: { target: 'drone', multiplier: 2 },
    cost: { chip: 100 },
    requirement: '50 дронов',
    isUnlocked: (s) => s.buildings.drone >= 50,
  },
  {
    id: 'factory1',
    name: 'Нанолитография',
    description: 'Фабрики: вход и выход ×2',
    effect: { target: 'factory', input: 2, output: 2 },
    cost: { chip: 100 },
    requirement: '10 фабрик',
    isUnlocked: (s) => s.buildings.factory >= 10,
  },
  {
    id: 'click3',
    name: 'Гравитационный захват',
    description: 'Клик ×3',
    effect: { target: 'click', multiplier: 3 },
    cost: { chip: 500 },
    requirement: '1 фабрика',
    isUnlocked: (s) => s.buildings.factory >= 1,
  },
  {
    id: 'factory2',
    name: 'Чистые комнаты',
    description: 'Фабрики: выход ×1,5',
    effect: { target: 'factory', input: 1, output: 1.5 },
    cost: { chip: 1000 },
    requirement: '25 фабрик',
    isUnlocked: (s) => s.buildings.factory >= 25,
  },
  {
    id: 'laser1',
    name: 'Фокусировка',
    description: 'Лазеры ×2',
    effect: { target: 'laser', multiplier: 2 },
    cost: { chip: 5000 },
    requirement: '10 лазеров',
    isUnlocked: (s) => s.buildings.laser >= 10,
  },
  {
    id: 'global1',
    name: 'Тёмная энергия',
    description: 'Всё производство ×1,5',
    effect: { target: 'global', multiplier: 1.5 },
    cost: { chip: 10000 },
    requirement: '1 перелёт',
    isUnlocked: (s) => s.prestigeCount >= 1,
  },
]

export const upgradeDef = (id: UpgradeId): UpgradeDef => UPGRADES.find((u) => u.id === id)!
