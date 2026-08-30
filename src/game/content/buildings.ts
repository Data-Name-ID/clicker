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
      id: 'smelter' | 'factory'
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
    description: '+0,5 руды/с',
    rate: 0.5,
    baseCost: { ore: 15 },
  },
  {
    id: 'smelter',
    kind: 'processor',
    name: 'Плавильня',
    description: '−2 руды/с → +1 сплава/с',
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
    description: '+4 руды/с',
    rate: 4,
    baseCost: { ore: 200 },
  },
  {
    id: 'factory',
    kind: 'processor',
    name: 'Фабрика микросхем',
    description: '−5 сплава/с → +1 чипа/с',
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
    description: '+40 руды/с',
    rate: 40,
    baseCost: { alloy: 3000, chip: 100 },
  },
]

export const BUILDING_IDS: BuildingId[] = BUILDINGS.map((b) => b.id)

export const buildingDef = (id: BuildingId): BuildingDef => BUILDINGS.find((b) => b.id === id)!
