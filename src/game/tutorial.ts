import type { GameState, TutorialStepId } from './types'

export type { TutorialStepId }

export interface TutorialStep {
  id: TutorialStepId
  kind: 'action' | 'info'
  title: string
  text: string
  hint: string
  progress?: (state: GameState) => string
  isReady?: (state: GameState) => boolean
  isDone: (state: GameState) => boolean
}

const CLICKS_TO_LEARN = 10

const seen = (state: GameState, id: TutorialStepId): boolean => state.tutorialSeen.includes(id)

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'click',
    kind: 'action',
    title: 'Добыча',
    text: 'Бей по астероиду — каждый удар откалывает руду.',
    hint: 'Бей по астероиду — нужно десять ударов',
    progress: (s) => `${Math.min(s.stats.clicks, CLICKS_TO_LEARN)} / ${CLICKS_TO_LEARN}`,
    isDone: (s) => s.stats.clicks >= CLICKS_TO_LEARN,
  },
  {
    id: 'quests',
    kind: 'info',
    title: 'Задания',
    text: 'Плашка с «!» подсказывает, чем заняться дальше. Награда придёт сама.',
    hint: 'Следи за плашкой задания: она ведёт по игре шаг за шагом',
    isDone: (s) => seen(s, 'quests'),
  },
  {
    id: 'drone',
    kind: 'action',
    title: 'Первый дрон',
    text: 'Дрон копает сам, без тебя. Стоит 15 руды и окупается за полминуты.',
    hint: 'Накопи 15 руды и купи бурового дрона в списке справа',
    isDone: (s) => s.buildings.drone >= 1,
  },
  {
    id: 'combo',
    kind: 'info',
    title: 'Ритм добычи',
    text: 'Бей без пауз — комбо усиливает удары. А заряд копится на «РАЗРЯД»: он отдаёт минуту работы базы разом.',
    hint: 'Шкала заряда и кнопка «РАЗРЯД» — прямо под астероидом',
    isReady: (s) => s.stats.clicks >= 50,
    isDone: (s) => seen(s, 'combo'),
  },
  {
    id: 'ads',
    kind: 'info',
    title: 'Бонусы за рекламу',
    text: 'Кнопки с телевизором дают бонус за короткий ролик. Что именно — написано в подсказке у кнопки.',
    hint: 'Кнопки с телевизором под астероидом — бонусы за ролик',
    isReady: (s) => s.buildings.drone >= 5,
    isDone: (s) => seen(s, 'ads'),
  },
  {
    id: 'smelter',
    kind: 'action',
    title: 'Плавильня',
    text: 'Плавильня переплавляет руду в сплав. Стоит 100 руды.',
    hint: 'Накопи 100 руды и купи плавильню в списке зданий',
    isDone: (s) => s.buildings.smelter >= 1,
  },
  {
    id: 'ore',
    kind: 'info',
    title: 'Расход руды',
    text: 'Плавильня ест 2 руды в секунду. Не хватает — работает вполсилы.',
    hint: 'Смотри строку «Эффективность» на карточке плавильни',
    isDone: (s) => seen(s, 'ore'),
  },
  {
    id: 'events',
    kind: 'info',
    title: 'События',
    text: 'Событие идёт строкой под ресурсами. Если предлагают сделку — там же кнопки.',
    hint: 'События приходят в строку под панелью ресурсов',
    isReady: (s) => s.stats.eventsSeen >= 1,
    isDone: (s) => seen(s, 'events'),
  },
  {
    id: 'skills',
    kind: 'info',
    title: 'Навыки',
    text: 'Новый уровень дал очко навыка. Трать его в «Навыках» — перки остаются навсегда.',
    hint: 'Очки навыков тратятся во вкладке «Навыки» внизу',
    isReady: (s) => s.xp >= 100,
    isDone: (s) => seen(s, 'skills'),
  },
  {
    id: 'factory',
    kind: 'action',
    title: 'Фабрика',
    text: 'Фабрика делает из сплава чипы. Стоит 500 сплава.',
    hint: 'Накопи 500 сплава и построй фабрику микросхем',
    isDone: (s) => s.buildings.factory >= 1,
  },
  {
    id: 'cores',
    kind: 'info',
    title: 'ИИ-ядра',
    text: 'Нейролаборатория растит ИИ-ядра из чипов. Ядра усиливают награду за перелёт.',
    hint: 'Нейролаборатория делает ядра из чипов — она в списке зданий',
    isReady: (s) => s.stats.peakResources.chip >= 500,
    isDone: (s) => seen(s, 'cores'),
  },
  {
    id: 'expeditions',
    kind: 'info',
    title: 'Экспедиции',
    text: 'Под астероидом открылись рейды. Отряд уходит на время и возвращается с грузом.',
    hint: 'Панель рейдов — под кнопками рядом с астероидом',
    isReady: (s) => s.buildings.drone >= 10,
    isDone: (s) => seen(s, 'expeditions'),
  },
  {
    id: 'bonuses',
    kind: 'info',
    title: 'Скрытые бонусы',
    text: 'Каждые 25 одинаковых зданий удваивают их работу. Достижения тоже прибавляют производство.',
    hint: 'Каждые 25 зданий одного типа удваивают их работу',
    isReady: (s) => Math.max(...Object.values(s.buildings)) >= 20,
    isDone: (s) => seen(s, 'bonuses'),
  },
  {
    id: 'prestige',
    kind: 'info',
    title: 'Перелёт',
    text: '10 000 чипов — и можно улетать. Всё обнулится, но тёмная материя ускорит следующий забег.',
    hint: 'Собери 10 000 чипов и улетай во вкладке «Перелёт»',
    isReady: (s) => s.stats.runChips >= 1000,
    isDone: (s) => s.prestigeCount >= 1,
  },
  {
    id: 'shipInfo',
    kind: 'info',
    title: 'Артефакт и корабль',
    text: 'Артефакт усиливает один забег, а корабль за тёмную материю — навсегда.',
    hint: 'Покупки за материю — во вкладке «Перелёт», раздел «Корабль»',
    isReady: (s) => s.prestigeCount >= 1,
    isDone: (s) => seen(s, 'shipInfo'),
  },
  {
    id: 'galaxyInfo',
    kind: 'info',
    title: 'Галактика',
    text: 'Пять перелётов и сотня материи откроют прыжок в новую галактику: осколки, таланты, испытания. Дальше сам — удачи!',
    hint: 'Прыжок откроется после пяти перелётов и сотни материи',
    isReady: (s) => s.prestigeCount >= 2,
    isDone: () => false,
  },
]

export const isLastTutorialStep = (step: TutorialStep): boolean =>
  step.id === TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id

export function tutorialStep(state: GameState): TutorialStep | null {
  if (state.tutorialDismissed) return null
  return TUTORIAL_STEPS.find((step) => !step.isDone(state) && (step.isReady?.(state) ?? true)) ?? null
}

export const dismissTutorial = (state: GameState): GameState => ({ ...state, tutorialDismissed: true })

export const markTutorialSeen = (state: GameState, id: TutorialStepId): GameState =>
  state.tutorialSeen.includes(id) ? state : { ...state, tutorialSeen: [...state.tutorialSeen, id] }
