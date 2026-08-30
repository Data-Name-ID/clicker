import type { AdPlacement } from '../ads/AdProvider'
import { formatDuration } from '../game/format'
import {
  BOOST_COOLDOWN_MS,
  BOOST_DURATION,
  EVENT_RUSH_COOLDOWN_MS,
  METEOR_COOLDOWN_MS,
  METEOR_DURATION,
  REROLL_COOLDOWN_MS,
  SUPPLY_COOLDOWN_MS,
  SUPPLY_SECONDS,
} from '../game/rewards'
import { MOCK_AD_COUNTDOWN_SECONDS } from '../ads/MockAdProvider'

export interface AdInfo {
  title: string
  effect: string
  cooldown: string
}

const minutes = (ms: number): string => `${Math.round(ms / 60_000)} мин`

export const AD_INFO: Record<AdPlacement, AdInfo> = {
  boost: {
    title: 'Перегрузка реактора',
    effect: `Всё производство ×2 на ${minutes(BOOST_DURATION * 1000)}.`,
    cooldown: `Перезарядка ${minutes(BOOST_COOLDOWN_MS)} после окончания.`,
  },
  meteorShower: {
    title: 'Метеоритный дождь',
    effect: `Клик ×10 на ${formatDuration(METEOR_DURATION * 1000)} — по экрану падают метеоры.`,
    cooldown: `Перезарядка ${minutes(METEOR_COOLDOWN_MS)}.`,
  },
  supply: {
    title: 'Экстренная поставка',
    effect: `Сразу получаешь всё, что здания произвели бы за ${minutes(SUPPLY_SECONDS * 1000)}.`,
    cooldown: `Перезарядка ${minutes(SUPPLY_COOLDOWN_MS)}.`,
  },
  offlineDouble: {
    title: 'Забрать ×2',
    effect: 'Прирост за время отсутствия начислится ещё раз.',
    cooldown: 'Один раз за возвращение.',
  },
  prestigeBonus: {
    title: 'Перелёт с бонусом',
    effect: 'Тёмной материи за перелёт ×1,5.',
    cooldown: 'Без перезарядки.',
  },
  artifactReroll: {
    title: 'Сменить артефакт',
    effect: 'Случайный другой артефакт на этот забег.',
    cooldown: `Перезарядка ${minutes(REROLL_COOLDOWN_MS)}.`,
  },
  eventRush: {
    title: 'Вызвать событие',
    effect: 'Немедленно запускает случайное событие.',
    cooldown: `Перезарядка ${minutes(EVENT_RUSH_COOLDOWN_MS)}.`,
  },
  catDouble: {
    title: 'Открыть два ящика',
    effect: 'Кот разрешит открыть два ящика вместо одного.',
    cooldown: 'Без перезарядки.',
  },
}

export const AD_WATCH_NOTE = `За просмотр рекламы (${MOCK_AD_COUNTDOWN_SECONDS} с).`
