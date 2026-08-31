import { productionPerSecond } from '../economy'
import type { GameState, Resources } from '../types'

export interface QuestDef {
  id: string
  name: string
  description: string
  metric: (state: GameState) => number
  goal: (state: GameState) => number
  reward: (state: GameState) => Partial<Resources>
  rewardText: string
  absolute?: boolean
}

const oreReward = (seconds: number, min: number) => (state: GameState): Partial<Resources> => ({
  ore: Math.max(min, productionPerSecond(state) * seconds),
})

export const QUEST_CHAIN: QuestDef[] = [
  {
    id: 'clicks50',
    name: 'Первые удары',
    description: 'Стукни по астероиду пятьдесят раз',
    metric: (s) => s.stats.clicks,
    goal: () => 50,
    reward: () => ({ ore: 50 }),
    rewardText: '+50 руды',
  },
  {
    id: 'drones5',
    name: 'Пять помощников',
    description: 'Заведи пятерых дронов',
    metric: (s) => s.buildings.drone,
    goal: () => 5,
    reward: () => ({ ore: 100 }),
    rewardText: '+100 руды',
  },
  {
    id: 'ore500',
    name: 'Первая выработка',
    description: 'Накопай 500 руды',
    metric: (s) => s.stats.totalProduced.ore,
    goal: () => 500,
    reward: () => ({ ore: 150 }),
    rewardText: '+150 руды',
  },
  {
    id: 'smelters3',
    name: 'Литейный цех',
    description: 'Поставь три плавильни',
    metric: (s) => s.buildings.smelter,
    goal: () => 3,
    reward: () => ({ ore: 200 }),
    rewardText: '+200 руды',
  },
  {
    id: 'alloy200',
    name: 'Металлург',
    description: 'Выплави 200 сплава',
    metric: (s) => s.stats.totalProduced.alloy,
    goal: () => 200,
    reward: () => ({ alloy: 50 }),
    rewardText: '+50 сплава',
  },
  {
    id: 'combo10',
    name: 'Разогрев пальцев',
    description: 'Набери комбо 10: бей без пауз, перерыв дольше двух секунд всё сбросит',
    metric: (s) => s.stats.comboBest,
    goal: () => 10,
    reward: () => ({ ore: 300 }),
    rewardText: '+300 руды',
    absolute: true,
  },
  {
    id: 'excavators5',
    name: 'Тяжёлая техника',
    description: 'Пригони пять экскаваторов',
    metric: (s) => s.buildings.excavator,
    goal: () => 5,
    reward: () => ({ alloy: 100 }),
    rewardText: '+100 сплава',
  },
  {
    id: 'clicks500',
    name: 'Рабочий ритм',
    description: 'Ещё пятьсот ударов по астероиду',
    metric: (s) => s.stats.clicks,
    goal: () => 500,
    reward: oreReward(300, 500),
    rewardText: '5 минут добычи руды',
  },
  {
    id: 'factory1',
    name: 'Микросхемы',
    description: 'Построй фабрику',
    metric: (s) => s.buildings.factory,
    goal: () => 1,
    reward: () => ({ alloy: 200 }),
    rewardText: '+200 сплава',
  },
  {
    id: 'chips100',
    name: 'Кремниевый поток',
    description: 'Напечатай 100 чипов',
    metric: (s) => s.stats.totalProduced.chip,
    goal: () => 100,
    reward: () => ({ chip: 25 }),
    rewardText: '+25 чипов',
  },
  {
    id: 'meteors3',
    name: 'Ловкость рук',
    description: 'Поймай три метеора',
    metric: (s) => s.stats.meteorsCaught,
    goal: () => 3,
    reward: oreReward(600, 1000),
    rewardText: '10 минут добычи руды',
  },
  {
    id: 'events3',
    name: 'Свидетель',
    description: 'Переживи три события',
    metric: (s) => s.stats.eventsSeen,
    goal: () => 3,
    reward: () => ({ chip: 50 }),
    rewardText: '+50 чипов',
  },
  {
    id: 'drones25',
    name: 'Рой',
    description: 'Доведи стаю дронов до 25',
    metric: (s) => s.buildings.drone,
    goal: () => 25,
    reward: () => ({ chip: 75 }),
    rewardText: '+75 чипов',
    absolute: true,
  },
  {
    id: 'discharge1',
    name: 'На полную',
    description: 'Разряди реактор',
    metric: (s) => s.stats.discharges,
    goal: () => 1,
    reward: () => ({ chip: 100 }),
    rewardText: '+100 чипов',
  },
  {
    id: 'chips2500',
    name: 'Конвейер чипов',
    description: 'Напечатай 2 500 чипов',
    metric: (s) => s.stats.totalProduced.chip,
    goal: () => 2500,
    reward: () => ({ chip: 200 }),
    rewardText: '+200 чипов',
  },
  {
    id: 'smelters25',
    name: 'Плавильный квартал',
    description: 'Доведи плавильни до 25',
    metric: (s) => s.buildings.smelter,
    goal: () => 25,
    reward: () => ({ chip: 250 }),
    rewardText: '+250 чипов',
    absolute: true,
  },
  {
    id: 'neurolab1',
    name: 'Разум машины',
    description: 'Построй нейролабораторию',
    metric: (s) => s.buildings.neurolab,
    goal: () => 1,
    reward: () => ({ core: 10 }),
    rewardText: '+10 ядер',
  },
  {
    id: 'cores100',
    name: 'Мысли роятся',
    description: 'Обучи 100 ядер',
    metric: (s) => s.stats.totalProduced.core,
    goal: () => 100,
    reward: () => ({ core: 25 }),
    rewardText: '+25 ядер',
  },
  {
    id: 'prestige1',
    name: 'Пора лететь',
    description: 'Улети к новому астероиду',
    metric: (s) => s.prestigeCount,
    goal: () => 1,
    reward: () => ({ core: 50 }),
    rewardText: '+50 ядер',
  },
  {
    id: 'ship1',
    name: 'Обустройство',
    description: 'Прокачай корабль',
    metric: (s) => s.shipUpgrades.length,
    goal: () => 1,
    reward: () => ({ core: 100 }),
    rewardText: '+100 ядер',
  },
]

export const QUEST_REPEATABLE: QuestDef[] = [
  {
    id: 'clicksR',
    name: 'Вечный бур',
    description: 'Стукни по астероиду тысячу раз',
    metric: (s) => s.stats.clicks,
    goal: () => 1000,
    reward: oreReward(600, 2000),
    rewardText: '10 минут добычи руды',
  },
  {
    id: 'oreR',
    name: 'Норма выработки',
    description: 'Накопай столько руды, сколько даёт час работы',
    metric: (s) => s.stats.totalProduced.ore,
    goal: (s) => Math.max(5000, productionPerSecond(s) * 3600),
    reward: oreReward(1800, 2500),
    rewardText: '30 минут добычи руды',
  },
  {
    id: 'meteorsR',
    name: 'Каменный град',
    description: 'Поймай десять метеоров',
    metric: (s) => s.stats.meteorsCaught,
    goal: () => 10,
    reward: () => ({ chip: 150 }),
    rewardText: '+150 чипов',
  },
  {
    id: 'eventsR',
    name: 'Хроника происшествий',
    description: 'Переживи пять событий',
    metric: (s) => s.stats.eventsSeen,
    goal: () => 5,
    reward: () => ({ core: 25 }),
    rewardText: '+25 ядер',
  },
  {
    id: 'chipsR',
    name: 'Большой заказ',
    description: 'Напечатай 10 000 чипов',
    metric: (s) => s.stats.totalProduced.chip,
    goal: () => 10_000,
    reward: () => ({ core: 50 }),
    rewardText: '+50 ядер',
  },
]

export interface ActiveQuest {
  def: QuestDef
  scale: number
}

export function questAt(index: number): ActiveQuest {
  if (index < QUEST_CHAIN.length) return { def: QUEST_CHAIN[index], scale: 1 }
  const tail = index - QUEST_CHAIN.length
  const loop = Math.floor(tail / QUEST_REPEATABLE.length)
  return { def: QUEST_REPEATABLE[tail % QUEST_REPEATABLE.length], scale: 2 ** loop }
}
