import type { EventId, GameState } from '../types'

export type EventKind = 'timed' | 'offer' | 'spawn'

export interface EventDef {
  id: EventId
  kind: EventKind
  name: string
  description: string
  duration: number
  minPrestige: number
  isEligible?: (state: GameState) => boolean
}

export const EVENTS: EventDef[] = [
  {
    id: 'goldVein',
    kind: 'timed',
    name: 'Золотая жила',
    description: 'Руда идёт впятеро гуще — 30 секунд',
    duration: 30,
    minPrestige: 0,
  },
  {
    id: 'comet',
    kind: 'spawn',
    name: 'Пролетающая комета',
    description: 'Успей кликнуть — подарит десять минут добычи',
    duration: 6,
    minPrestige: 0,
  },
  {
    id: 'magneticStorm',
    kind: 'timed',
    name: 'Магнитная буря',
    description: 'Плавильни встали на 45 секунд, зато удар впятеро сильнее',
    duration: 45,
    minPrestige: 0,
    isEligible: (s) => s.buildings.smelter > 0,
  },
  {
    id: 'caravan',
    kind: 'offer',
    name: 'Караван торговцев',
    description: 'Меняют половину твоей руды на сплав',
    duration: 20,
    minPrestige: 0,
    isEligible: (s) => s.resources.ore >= 500,
  },
  {
    id: 'blackMarket',
    kind: 'offer',
    name: 'Чёрный рынок',
    description: 'Меняют половину твоего сплава на чипы',
    duration: 20,
    minPrestige: 0,
    isEligible: (s) => s.resources.alloy >= 500,
  },
  {
    id: 'meteorHail',
    kind: 'timed',
    name: 'Метеоритный град',
    description: 'Метеоры сыплются 20 секунд — лови их кликом',
    duration: 20,
    minPrestige: 0,
  },
  {
    id: 'solarFlare',
    kind: 'timed',
    name: 'Солнечная вспышка',
    description: 'Минуту добытчики вдвое быстрее, переработка вполсилы',
    duration: 60,
    minPrestige: 0,
    isEligible: (s) => s.buildings.smelter > 0 || s.buildings.factory > 0,
  },
  {
    id: 'strayDrone',
    kind: 'spawn',
    name: 'Заблудившийся дрон',
    description: 'Кликни — останется работать бесплатно',
    duration: 8,
    minPrestige: 0,
    isEligible: (s) => s.stats.strayDrones < 10 && s.buildings.drone > 0,
  },
  {
    id: 'oreFever',
    kind: 'timed',
    name: 'Рудная лихорадка',
    description: 'Полминуты каждый удар подгоняет добытчиков',
    duration: 30,
    minPrestige: 0,
    isEligible: (s) => s.buildings.drone + s.buildings.excavator + s.buildings.laser > 0,
  },
  {
    id: 'dataFog',
    kind: 'timed',
    name: 'Туман данных',
    description: 'Минуту лаборатории втрое быстрее, а фабрики стоят',
    duration: 60,
    minPrestige: 0,
    isEligible: (s) => s.buildings.neurolab > 0,
  },
]

export const eventDef = (id: EventId): EventDef => EVENTS.find((e) => e.id === id)!

export function eligibleEvents(state: GameState): EventDef[] {
  return EVENTS.filter((e) => state.prestigeCount >= e.minPrestige && (e.isEligible?.(state) ?? true))
}
