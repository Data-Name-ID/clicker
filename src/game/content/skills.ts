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
  { id: 'miner1', tree: 'miner', name: 'Крепкая рука', description: 'Бьёшь в полтора раза сильнее', requires: [] },
  { id: 'miner2', tree: 'miner', name: 'Точный удар', description: 'Криты случаются чаще', requires: ['miner1'] },
  { id: 'miner3', tree: 'miner', name: 'Широкий захват', description: 'Удар вдвое сильнее', requires: ['miner1'] },
  { id: 'miner4', tree: 'miner', name: 'Сила крита', description: 'Криты бьют в пятнадцать раз, а не в десять', requires: ['miner2'] },
  { id: 'miner5', tree: 'miner', name: 'Эхо удара', description: 'Иногда удар срабатывает дважды', requires: ['miner3'] },
  { id: 'miner6', tree: 'miner', name: 'Молотобоец', description: 'Комбо держится три секунды вместо двух', requires: ['miner4', 'miner5'] },
  { id: 'miner7', tree: 'miner', name: 'Гнев горы', description: 'Разряд отдаёт полторы минуты работы', requires: ['miner6'] },
  { id: 'miner8', tree: 'miner', name: 'Сердце астероида', description: 'Удар снова вдвое сильнее', requires: ['miner7'] },

  { id: 'swarm1', tree: 'swarm', name: 'Смазка', description: 'Дроны копают на четверть быстрее', requires: [] },
  { id: 'swarm2', tree: 'swarm', name: 'Тяжёлые ковши', description: 'Экскаваторы на четверть быстрее', requires: [] },
  { id: 'swarm3', tree: 'swarm', name: 'Автономность', description: 'Дроны копают в полтора раза быстрее', requires: ['swarm1'] },
  { id: 'swarm4', tree: 'swarm', name: 'Глубокая выработка', description: 'Экскаваторы в полтора раза быстрее', requires: ['swarm2'] },
  { id: 'swarm5', tree: 'swarm', name: 'Слаженность', description: 'Вся добыча растёт на 15 %', requires: ['swarm1'] },
  { id: 'swarm6', tree: 'swarm', name: 'Лазерная фокусировка', description: 'Лазеры в полтора раза сильнее', requires: ['swarm3', 'swarm4'] },
  { id: 'swarm7', tree: 'swarm', name: 'Синхронный рой', description: 'Здания помогают друг другу вдвое лучше', requires: ['swarm6'] },
  { id: 'swarm8', tree: 'swarm', name: 'Армада', description: 'Вся добыча в полтора раза больше', requires: ['swarm7'] },

  { id: 'eng1', tree: 'eng', name: 'Изоляция печей', description: 'Плавильни на четверть быстрее', requires: [] },
  { id: 'eng2', tree: 'eng', name: 'Чистый кремний', description: 'Фабрики на четверть быстрее', requires: ['eng1'] },
  { id: 'eng3', tree: 'eng', name: 'Горячий цикл', description: 'Плавильни не встают совсем: десятая доля мощности всегда', requires: ['eng1'] },
  { id: 'eng4', tree: 'eng', name: 'Пакетная сборка', description: 'Фабрики в полтора раза быстрее', requires: ['eng2'] },
  { id: 'eng5', tree: 'eng', name: 'Терморегенерация', description: 'Плавильни в полтора раза быстрее', requires: ['eng3'] },
  { id: 'eng6', tree: 'eng', name: 'Нейроускорение', description: 'Лаборатории на четверть быстрее', requires: ['eng4'] },
  { id: 'eng7', tree: 'eng', name: 'Каскад', description: 'Вся переработка на четверть быстрее', requires: ['eng5', 'eng6'] },
  { id: 'eng8', tree: 'eng', name: 'Сингулярный конвейер', description: 'Вся переработка в полтора раза быстрее', requires: ['eng7'] },

  { id: 'astro1', tree: 'astro', name: 'Прогноз', description: 'События приходят на 15 % чаще', requires: [] },
  { id: 'astro2', tree: 'astro', name: 'Длинный хвост', description: 'События длятся в полтора раза дольше', requires: ['astro1'] },
  { id: 'astro3', tree: 'astro', name: 'Меткость', description: 'Метеор приносит минуту добычи', requires: ['astro1'] },
  { id: 'astro4', tree: 'astro', name: 'Ясное небо', description: 'События приходят ещё на четверть чаще', requires: ['astro2'] },
  { id: 'astro5', tree: 'astro', name: 'Кометная пыль', description: 'Комета приносит двадцать минут добычи', requires: ['astro3'] },
  { id: 'astro6', tree: 'astro', name: 'Торговые связи', description: 'Торговцы меняют по щедрому курсу', requires: ['astro4'] },
  { id: 'astro7', tree: 'astro', name: 'Град даров', description: 'Метеоритный дождь длиннее на пятнадцать секунд', requires: ['astro5', 'astro6'] },
  { id: 'astro8', tree: 'astro', name: 'Око бури', description: 'Пока идёт событие, вся добыча +25 %', requires: ['astro7'] },

  { id: 'captain1', tree: 'captain', name: 'Навигация', description: 'Рейды приносят на четверть больше', requires: [] },
  { id: 'captain2', tree: 'captain', name: 'Бронированные трюмы', description: 'Рейд срывается реже — раз в десять вылазок', requires: ['captain1'] },
  { id: 'captain3', tree: 'captain', name: 'Удача первопроходца', description: 'Редкие находки попадаются чаще', requires: ['captain1'] },
  { id: 'captain4', tree: 'captain', name: 'Спасательные капсулы', description: 'При провале теряется четверть отряда, а не половина', requires: ['captain2'] },
  { id: 'captain5', tree: 'captain', name: 'Контрабандные каналы', description: 'Реклама перезаряжается на пятую часть быстрее', requires: ['captain3'] },
  { id: 'captain6', tree: 'captain', name: 'Гружёные караваны', description: 'Рейды приносят ещё в полтора раза больше', requires: ['captain4', 'captain5'] },
  { id: 'captain7', tree: 'captain', name: 'Флотилия', description: 'Ещё один отряд может быть в рейде', requires: ['captain6'] },
  { id: 'captain8', tree: 'captain', name: 'Легенда космоса', description: 'С редкой находкой всегда приходит тёмная материя', requires: ['captain7'] },

  { id: 'dark1', tree: 'dark', name: 'Тёмное чутьё', description: 'Опыта капает на 10 % больше', requires: [] },
  { id: 'dark2', tree: 'dark', name: 'Глубокая тьма', description: 'Тёмная материя не выдыхается до 120 единиц', requires: ['dark1'] },
  { id: 'dark3', tree: 'dark', name: 'Жадный сбор', description: 'Каждый перелёт даёт на единицу материи больше', requires: ['dark1'] },
  { id: 'dark4', tree: 'dark', name: 'Стабильная материя', description: 'Тёмная материя действует на 10 % сильнее', requires: ['dark2'] },
  { id: 'dark5', tree: 'dark', name: 'Ясность ядра', description: 'Ядра ценятся выше при перелёте', requires: ['dark3'] },
  { id: 'dark6', tree: 'dark', name: 'Чёрная жила', description: 'Каждый перелёт даёт ещё на две единицы больше', requires: ['dark4', 'dark5'] },
  { id: 'dark7', tree: 'dark', name: 'Пожиратель звёзд', description: 'Осколков с прыжка на пятую часть больше', requires: ['dark6'] },
  { id: 'dark8', tree: 'dark', name: 'Аватар пустоты', description: 'Каждая галактика добавляет 25 % ко всему, до сотни', requires: ['dark7'] },
]

export const skillDef = (id: SkillId): SkillDef => SKILLS.find((s) => s.id === id)!

export const hasSkill = (state: GameState, id: SkillId): boolean => state.skills.includes(id)

export const skillsInTree = (tree: SkillTreeId): SkillDef[] => SKILLS.filter((s) => s.tree === tree)
