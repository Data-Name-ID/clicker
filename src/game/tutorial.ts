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
    text: 'Тапай по астероиду — так добывается руда. Десять ударов, и двигаемся дальше.',
    hint: 'Тапай по астероиду',
    progress: (s) => `${Math.min(s.stats.clicks, CLICKS_TO_LEARN)} / ${CLICKS_TO_LEARN}`,
    isDone: (s) => s.stats.clicks >= CLICKS_TO_LEARN,
  },
  {
    id: 'drone',
    kind: 'action',
    title: 'Первый дрон',
    text:
      'Буровой дрон копает сам, даже когда ты не тапаешь. Стоит 15 руды — купи его. ' +
      'Остальные здания открываются постепенно: карточка появляется, когда накопишь примерно половину её цены.',
    hint: 'Купи Бурового дрона',
    isDone: (s) => s.buildings.drone >= 1,
  },
  {
    id: 'ads',
    kind: 'info',
    title: 'Реклама = бонусы',
    text:
      'Кнопки с ▶ работают за просмотр короткой рекламы. «Перегрузка реактора» удваивает всё производство на 10 минут, ' +
      '«Метеоритный дождь» даёт клик ×10 на 30 секунд, «Экстренная поставка» во вкладке «Здания» — ресурсы за 30 минут работы. ' +
      'Ещё реклама удваивает прирост за время отсутствия и даёт ×1,5 тёмной материи при перелёте.',
    hint: 'Кнопки с ▶ — бонусы за рекламу',
    isDone: (s) => seen(s, 'ads'),
  },
  {
    id: 'smelter',
    kind: 'action',
    title: 'Плавильня',
    text: 'Плавильня переплавляет руду в сплав. Стоит 100 руды — накопи и купи.',
    hint: 'Накопи 100 руды на Плавильню',
    isDone: (s) => s.buildings.smelter >= 1,
  },
  {
    id: 'ore',
    kind: 'info',
    title: 'Расход руды',
    text:
      'Плавильня съедает 2 руды/с и выдаёт 1 сплав/с — руда теперь не только копится, но и тратится. ' +
      'Если руды не хватает, плавильня работает не в полную силу: смотри «Эффективность» в её карточке. ' +
      'Держи добычу выше расхода — покупай дронов и экскаваторы.',
    hint: 'Следи за эффективностью плавилен',
    isDone: (s) => seen(s, 'ore'),
  },
  {
    id: 'factory',
    kind: 'action',
    title: 'Фабрика',
    text: 'Фабрика делает чипы из сплава: съедает 5 сплава/с, выдаёт 1 чип/с. Стоит 500 сплава. Чипы открывают улучшения и перелёт.',
    hint: 'Накопи 500 сплава на Фабрику',
    isDone: (s) => s.buildings.factory >= 1,
  },
  {
    id: 'prestige',
    kind: 'info',
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

export const markTutorialSeen = (state: GameState, id: TutorialStepId): GameState =>
  state.tutorialSeen.includes(id) ? state : { ...state, tutorialSeen: [...state.tutorialSeen, id] }
