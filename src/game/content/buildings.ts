import type { BuildingId, Cost, ResourceId } from '../types'

export type BuildingDef =
  | {
      id: 'drone' | 'excavator' | 'laser'
      kind: 'producer'
      name: string
      description: string
      rate: number
      baseCost: Cost
    }
  | {
      id: 'smelter' | 'factory' | 'neurolab'
      kind: 'processor'
      name: string
      description: string
      input: ResourceId
      output: ResourceId
      inputRate: number
      outputRate: number
      baseCost: Cost
    }

export const COST_GROWTH = 1.15

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'drone',
    kind: 'producer',
    name: 'Буровой дрон',
    description: 'Съедает 2 руды в секунду, отдаёт 1 сплав',
    rate: 0.5,
    baseCost: { ore: 15 },
  },
  {
    id: 'smelter',
    kind: 'processor',
    name: 'Плавильня',
    description: 'Переплавляет 2 руды/с в 1 сплав/с',
    input: 'ore',
    output: 'alloy',
    inputRate: 2,
    outputRate: 1,
    baseCost: { ore: 100 },
  },
  {
    id: 'excavator',
    kind: 'producer',
    name: 'Экскаватор',
    description: 'Черпает ковшом: +4 руды в секунду',
    rate: 4,
    baseCost: { ore: 200 },
  },
  {
    id: 'factory',
    kind: 'processor',
    name: 'Фабрика микросхем',
    description: 'Съедает 5 сплава в секунду, печатает 1 чип',
    input: 'alloy',
    output: 'chip',
    inputRate: 5,
    outputRate: 1,
    baseCost: { alloy: 500 },
  },
  {
    id: 'laser',
    kind: 'producer',
    name: 'Орбитальный лазер',
    description: 'Режет астероид с орбиты: +40 руды в секунду',
    rate: 40,
    baseCost: { alloy: 3000, chip: 100 },
  },
  {
    id: 'neurolab',
    kind: 'processor',
    name: 'Нейролаборатория',
    description: 'Съедает 10 чипов в секунду, обучает половину ядра',
    input: 'chip',
    output: 'core',
    inputRate: 10,
    outputRate: 0.5,
    baseCost: { chip: 2000 },
  },
]

export const BUILDING_IDS: BuildingId[] = BUILDINGS.map((b) => b.id)

export const buildingDef = (id: BuildingId): BuildingDef => BUILDINGS.find((b) => b.id === id)!
