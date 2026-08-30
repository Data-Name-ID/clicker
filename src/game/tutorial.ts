import type { GameState } from './types'

export type TutorialStepId = 'click' | 'drone' | 'smelter' | 'factory' | 'prestige'

export interface TutorialStep {
  id: TutorialStepId
  title: string
  text: string
  hint: string
  progress?: (state: GameState) => string
  isDone: (state: GameState) => boolean
}

const CLICKS_TO_LEARN = 10

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'click',
    title: 'Добыча',
    text: 'Тапай по астероиду — так добывается руда. Десять ударов, и двигаемся дальше.',
    hint: 'Тапай по астероиду',
    progress: (s) => `${Math.min(s.stats.clicks, CLICKS_TO_LEARN)} / ${CLICKS_TO_LEARN}`,
    isDone: (s) => s.stats.clicks >= CLICKS_TO_LEARN,
  },
  {
    id: 'drone',
    title: 'Первый дрон',
    text: 'Буровой дрон копает сам, даже когда ты не тапаешь. Стоит 15 руды — купи его.',
    hint: 'Купи Бурового дрона',
    isDone: (s) => s.buildings.drone >= 1,
  },
  {
    id: 'smelter',
    title: 'Плавильня',
    text: 'Плавильня переплавляет руду в сплав. Стоит 100 руды — накопи и купи.',
    hint: 'Накопи 100 руды на Плавильню',
    isDone: (s) => s.buildings.smelter >= 1,
  },
  {
    id: 'factory',
    title: 'Фабрика',
    text: 'Фабрика делает чипы из сплава (500 сплава). Чипы открывают улучшения и перелёт.',
    hint: 'Накопи 500 сплава на Фабрику',
    isDone: (s) => s.buildings.factory >= 1,
  },
  {
    id: 'prestige',
    title: 'Перелёт',
    text: 'Собери 10 000 чипов и перелетай к новому астероиду: за перелёт дают тёмную материю, а она ускоряет всё навсегда.',
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
