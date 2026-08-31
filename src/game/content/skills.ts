import type { GameState, SkillId, SkillTreeId } from '../types'

export interface SkillTreeDef {
  id: SkillTreeId
  name: string
}

export const SKILL_TREES: SkillTreeDef[] = [
  { id: 'miner', name: 'Шахтёр' },
  { id: 'swarm', name: 'Рой' },
  { id: 'eng', name: 'Инженер' },
  { id: 'astro', name: 'Звездочёт' },
  { id: 'captain', name: 'Капитан' },
  { id: 'dark', name: 'Тёмный жрец' },
]

export interface SkillDef {
  id: SkillId
  tree: SkillTreeId
  name: string
  description: string
  requires: SkillId[]
}

export const SKILLS: SkillDef[] = [
  { id: 'miner1', tree: 'miner', name: 'Крепкая рука', description: 'Клик +50 %', requires: [] },
  { id: 'miner2', tree: 'miner', name: 'Точный удар', description: 'Шанс крита +3 %', requires: ['miner1'] },
  { id: 'miner3', tree: 'miner', name: 'Широкий захват', description: 'Клик ×2', requires: ['miner1'] },
  { id: 'miner4', tree: 'miner', name: 'Сила крита', description: 'Крит ×15 вместо ×10', requires: ['miner2'] },
  { id: 'miner5', tree: 'miner', name: 'Эхо удара', description: '10 % шанс двойного клика', requires: ['miner3'] },
  { id: 'miner6', tree: 'miner', name: 'Молотобоец', description: 'Окно комбо 3 секунды', requires: ['miner4', 'miner5'] },
  { id: 'miner7', tree: 'miner', name: 'Гнев горы', description: 'РАЗРЯД даёт 90 секунд производства', requires: ['miner6'] },
  { id: 'miner8', tree: 'miner', name: 'Сердце астероида', description: 'Клик ×2', requires: ['miner7'] },

  { id: 'swarm1', tree: 'swarm', name: 'Смазка', description: 'Дроны +25 %', requires: [] },
  { id: 'swarm2', tree: 'swarm', name: 'Тяжёлые ковши', description: 'Экскаваторы +25 %', requires: [] },
  { id: 'swarm3', tree: 'swarm', name: 'Автономность', description: 'Дроны +50 %', requires: ['swarm1'] },
  { id: 'swarm4', tree: 'swarm', name: 'Глубокая выработка', description: 'Экскаваторы +50 %', requires: ['swarm2'] },
  { id: 'swarm5', tree: 'swarm', name: 'Слаженность', description: 'Вся добыча +15 %', requires: ['swarm1'] },
  { id: 'swarm6', tree: 'swarm', name: 'Лазерная фокусировка', description: 'Лазеры +50 %', requires: ['swarm3', 'swarm4'] },
  { id: 'swarm7', tree: 'swarm', name: 'Синхронный рой', description: 'Синергии зданий вдвое сильнее', requires: ['swarm6'] },
  { id: 'swarm8', tree: 'swarm', name: 'Армада', description: 'Вся добыча +50 %', requires: ['swarm7'] },

  { id: 'eng1', tree: 'eng', name: 'Изоляция печей', description: 'Плавильни +25 % скорости', requires: [] },
  { id: 'eng2', tree: 'eng', name: 'Чистый кремний', description: 'Фабрики +25 % скорости', requires: ['eng1'] },
  { id: 'eng3', tree: 'eng', name: 'Горячий цикл', description: 'Плавильни работают минимум на 10 % без руды', requires: ['eng1'] },
  { id: 'eng4', tree: 'eng', name: 'Пакетная сборка', description: 'Фабрики +50 % скорости', requires: ['eng2'] },
  { id: 'eng5', tree: 'eng', name: 'Терморегенерация', description: 'Плавильни +50 % скорости', requires: ['eng3'] },
  { id: 'eng6', tree: 'eng', name: 'Нейроускорение', description: 'Нейролаборатории +25 % скорости', requires: ['eng4'] },
  { id: 'eng7', tree: 'eng', name: 'Каскад', description: 'Все переработчики +25 %', requires: ['eng5', 'eng6'] },
  { id: 'eng8', tree: 'eng', name: 'Сингулярный конвейер', description: 'Все переработчики +50 %', requires: ['eng7'] },

  { id: 'astro1', tree: 'astro', name: 'Прогноз', description: 'События на 15 % чаще', requires: [] },
  { id: 'astro2', tree: 'astro', name: 'Длинный хвост', description: 'События длятся в 1,5 раза дольше', requires: ['astro1'] },
  { id: 'astro3', tree: 'astro', name: 'Меткость', description: 'Пойманный метеор даёт 60 секунд добычи', requires: ['astro1'] },
  { id: 'astro4', tree: 'astro', name: 'Ясное небо', description: 'События ещё на 25 % чаще', requires: ['astro2'] },
  { id: 'astro5', tree: 'astro', name: 'Кометная пыль', description: 'Комета даёт 20 минут добычи', requires: ['astro3'] },
  { id: 'astro6', tree: 'astro', name: 'Торговые связи', description: 'Курсы каравана и рынка +50 %', requires: ['astro4'] },
  { id: 'astro7', tree: 'astro', name: 'Град даров', description: 'Метеоритный дождь длится на 15 секунд дольше', requires: ['astro5', 'astro6'] },
  { id: 'astro8', tree: 'astro', name: 'Око бури', description: 'Во время событий всё производство +25 %', requires: ['astro7'] },

  { id: 'captain1', tree: 'captain', name: 'Навигация', description: 'Награда экспедиций +25 %', requires: [] },
  { id: 'captain2', tree: 'captain', name: 'Бронированные трюмы', description: 'Шанс провала 15 % → 10 %', requires: ['captain1'] },
  { id: 'captain3', tree: 'captain', name: 'Удача первопроходца', description: 'Шанс редкой находки +10 %', requires: ['captain1'] },
  { id: 'captain4', tree: 'captain', name: 'Спасательные капсулы', description: 'При провале теряется четверть отряда, а не половина', requires: ['captain2'] },
  { id: 'captain5', tree: 'captain', name: 'Контрабандные каналы', description: 'Кулдауны рекламы на 20 % короче', requires: ['captain3'] },
  { id: 'captain6', tree: 'captain', name: 'Гружёные караваны', description: 'Награда экспедиций ещё ×1,5', requires: ['captain4', 'captain5'] },
  { id: 'captain7', tree: 'captain', name: 'Флотилия', description: '+1 слот экспедиций', requires: ['captain6'] },
  { id: 'captain8', tree: 'captain', name: 'Легенда космоса', description: 'Редкая находка всегда приносит +1 ТМ', requires: ['captain7'] },

  { id: 'dark1', tree: 'dark', name: 'Тёмное чутьё', description: '+10 % опыта со всех источников', requires: [] },
  { id: 'dark2', tree: 'dark', name: 'Глубокая тьма', description: 'Мягкий кап тёмной материи 100 → 120', requires: ['dark1'] },
  { id: 'dark3', tree: 'dark', name: 'Жадный сбор', description: '+1 тёмной материи за перелёт', requires: ['dark1'] },
  { id: 'dark4', tree: 'dark', name: 'Стабильная материя', description: 'Пассивный бонус ТМ ×1,1', requires: ['dark2'] },
  { id: 'dark5', tree: 'dark', name: 'Ясность ядра', description: 'Ядра на 10 % сильнее усиливают перелёт', requires: ['dark3'] },
  { id: 'dark6', tree: 'dark', name: 'Чёрная жила', description: '+2 тёмной материи за перелёт', requires: ['dark4', 'dark5'] },
  { id: 'dark7', tree: 'dark', name: 'Пожиратель звёзд', description: 'Осколки Галактики +20 %', requires: ['dark6'] },
  { id: 'dark8', tree: 'dark', name: 'Аватар пустоты', description: '+25 % производства за каждую галактику (до +100 %)', requires: ['dark7'] },
]

export const skillDef = (id: SkillId): SkillDef => SKILLS.find((s) => s.id === id)!

export const hasSkill = (state: GameState, id: SkillId): boolean => state.skills.includes(id)

export const skillsInTree = (tree: SkillTreeId): SkillDef[] => SKILLS.filter((s) => s.tree === tree)
