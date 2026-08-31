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
    effect: `Всё производство вдвое быстрее — ${minutes(BOOST_DURATION * 1000)}.`,
    cooldown: `Заряжается ${minutes(BOOST_COOLDOWN_MS)} после окончания.`,
  },
  meteorShower: {
    title: 'Метеоритный дождь',
    effect: `Удар бьёт вдесятеро, а по экрану сыплются метеоры — ${formatDuration(METEOR_DURATION * 1000)}.`,
    cooldown: `Заряжается ${minutes(METEOR_COOLDOWN_MS)}.`,
  },
  supply: {
    title: 'Экстренная поставка',
    effect: `Сразу отдаёт всё, что здания наработали бы за ${minutes(SUPPLY_SECONDS * 1000)}.`,
    cooldown: `Заряжается ${minutes(SUPPLY_COOLDOWN_MS)}.`,
  },
  offlineDouble: {
    title: 'Забрать ×2',
    effect: 'Всё, что накопилось без тебя, начислится второй раз.',
    cooldown: 'Одно возвращение — одна кнопка.',
  },
  prestigeBonus: {
    title: 'Перелёт с бонусом',
    effect: 'За перелёт дадут в полтора раза больше материи.',
    cooldown: 'Заряжать не нужно.',
  },
  artifactReroll: {
    title: 'Сменить артефакт',
    effect: 'Меняет артефакт забега на другой, наугад.',
    cooldown: `Заряжается ${minutes(REROLL_COOLDOWN_MS)}.`,
  },
  eventRush: {
    title: 'Вызвать событие',
    effect: 'Прямо сейчас случается что-нибудь интересное.',
    cooldown: `Заряжается ${minutes(EVENT_RUSH_COOLDOWN_MS)}.`,
  },
  catDouble: {
    title: 'Открыть два ящика',
    effect: 'Кот разрешит вскрыть два ящика вместо одного.',
    cooldown: 'Заряжать не нужно.',
  },
}

export const AD_WATCH_NOTE = `Взамен — ролик на ${MOCK_AD_COUNTDOWN_SECONDS} секунд.`
