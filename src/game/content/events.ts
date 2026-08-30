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
    description: 'Добыча руды ×5 на 30 секунд',
    duration: 30,
    minPrestige: 0,
  },
  {
    id: 'comet',
    kind: 'spawn',
    name: 'Пролетающая комета',
    description: 'Кликни, пока не улетела: +10 минут добычи руды',
    duration: 6,
    minPrestige: 0,
  },
  {
    id: 'magneticStorm',
    kind: 'timed',
    name: 'Магнитная буря',
    description: 'Плавильни стоят 45 секунд, зато клик ×5',
    duration: 45,
    minPrestige: 0,
    isEligible: (s) => s.buildings.smelter > 0,
  },
  {
    id: 'caravan',
    kind: 'offer',
    name: 'Караван торговцев',
    description: 'Отдай 50 % руды — получи сплав по курсу ×1,2',
    duration: 20,
    minPrestige: 0,
    isEligible: (s) => s.resources.ore >= 500,
  },
  {
    id: 'blackMarket',
    kind: 'offer',
    name: 'Чёрный рынок',
    description: 'Отдай 50 % сплава — получи чипы по курсу ×1,1',
    duration: 20,
    minPrestige: 0,
    isEligible: (s) => s.resources.alloy >= 500,
  },
  {
    id: 'meteorHail',
    kind: 'timed',
    name: 'Метеоритный град',
    description: '20 секунд кликабельных метеоров — без рекламы',
    duration: 20,
    minPrestige: 0,
  },
  {
    id: 'solarFlare',
    kind: 'timed',
    name: 'Солнечная вспышка',
    description: '60 секунд: добытчики ×2, переработчики ×0,5',
    duration: 60,
    minPrestige: 0,
    isEligible: (s) => s.buildings.smelter > 0 || s.buildings.factory > 0,
  },
  {
    id: 'strayDrone',
    kind: 'spawn',
    name: 'Заблудившийся дрон',
    description: 'Кликни — присоединится бесплатно (до 10 за забег)',
    duration: 8,
    minPrestige: 0,
    isEligible: (s) => s.stats.strayDrones < 10 && s.buildings.drone > 0,
  },
  {
    id: 'oreFever',
    kind: 'timed',
    name: 'Рудная лихорадка',
    description: '30 секунд: каждый клик даёт +2 секунды работы добытчиков',
    duration: 30,
    minPrestige: 0,
    isEligible: (s) => s.buildings.drone + s.buildings.excavator + s.buildings.laser > 0,
  },
  {
    id: 'dataFog',
    kind: 'timed',
    name: 'Туман данных',
    description: '60 секунд: нейролаборатории ×3, фабрики стоят',
    duration: 60,
    minPrestige: 0,
    isEligible: (s) => s.buildings.neurolab > 0,
  },
]

export const eventDef = (id: EventId): EventDef => EVENTS.find((e) => e.id === id)!

export function eligibleEvents(state: GameState): EventDef[] {
  return EVENTS.filter((e) => state.prestigeCount >= e.minPrestige && (e.isEligible?.(state) ?? true))
}
