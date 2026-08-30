import type { GameState, TutorialStepId } from './types'

export type { TutorialStepId }

export interface TutorialStep {
  id: TutorialStepId
  kind: 'action' | 'info'
  title: string
  text: string
  hint: string
  progress?: (state: GameState) => string
  isDone: (state: GameState) => boolean
}

const CLICKS_TO_LEARN = 10

const seen = (state: GameState, id: TutorialStepId): boolean => state.tutorialSeen.includes(id)

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'click',
    kind: 'action',
    title: 'Добыча',
    text: 'Тапай по астероиду — так добывается руда.',
    hint: 'Тапай по астероиду',
    progress: (s) => `${Math.min(s.stats.clicks, CLICKS_TO_LEARN)} / ${CLICKS_TO_LEARN}`,
    isDone: (s) => s.stats.clicks >= CLICKS_TO_LEARN,
  },
  {
    id: 'drone',
    kind: 'action',
    title: 'Первый дрон',
    text: 'Дрон копает сам — купи его за 15 руды. Остальные здания откроются, когда накопишь ресурсы.',
    hint: 'Купи Бурового дрона',
    isDone: (s) => s.buildings.drone >= 1,
  },
  {
    id: 'ads',
    kind: 'info',
    title: 'Реклама = бонусы',
    text: 'Кнопки с телевизором — бонусы за короткую рекламу: производство ×2, клик ×10, поставка ресурсов. Подробности — в подсказке у кнопки.',
    hint: 'Кнопки с телевизором — бонусы за рекламу',
    isDone: (s) => seen(s, 'ads'),
  },
  {
    id: 'smelter',
    kind: 'action',
    title: 'Плавильня',
    text: 'Плавильня превращает руду в сплав. Купи её за 100 руды.',
    hint: 'Накопи 100 руды на Плавильню',
    isDone: (s) => s.buildings.smelter >= 1,
  },
  {
    id: 'ore',
    kind: 'info',
    title: 'Расход руды',
    text: 'Плавильня тратит 2 руды/с. Не хватает руды — падает эффективность. Держи добычу выше расхода.',
    hint: 'Следи за эффективностью плавилен',
    isDone: (s) => seen(s, 'ore'),
  },
  {
    id: 'factory',
    kind: 'action',
    title: 'Фабрика',
    text: 'Фабрика делает чипы из сплава. Стоит 500 сплава. Чипы открывают улучшения и перелёт.',
    hint: 'Накопи 500 сплава на Фабрику',
    isDone: (s) => s.buildings.factory >= 1,
  },
  {
    id: 'cores',
    kind: 'info',
    title: 'ИИ-ядра',
    text: 'Нейролаборатория варит из чипов ИИ-ядра. Ядра умножают награду перелёта (первые 50 — вдвое) и покупают самые мощные улучшения.',
    hint: 'Ядра усиливают перелёт',
    isDone: (s) => seen(s, 'cores'),
  },
  {
    id: 'prestige',
    kind: 'info',
    title: 'Перелёт',
    text: 'Собери 10 000 чипов и перелетай к новому астероиду. Тёмная материя ускоряет всё навсегда.',
    hint: 'Собери 10 000 чипов',
    isDone: (s) => s.prestigeCount >= 1,
  },
]

export const isLastTutorialStep = (step: TutorialStep): boolean =>
  step.id === TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id

export function tutorialStep(state: GameState): TutorialStep | null {
  if (state.tutorialDismissed) return null
  return TUTORIAL_STEPS.find((step) => !step.isDone(state)) ?? null
}

export const dismissTutorial = (state: GameState): GameState => ({ ...state, tutorialDismissed: true })

export const markTutorialSeen = (state: GameState, id: TutorialStepId): GameState =>
  state.tutorialSeen.includes(id) ? state : { ...state, tutorialSeen: [...state.tutorialSeen, id] }
