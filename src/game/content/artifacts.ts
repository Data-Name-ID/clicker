import type { ArtifactId, GameState } from '../types'

export interface ArtifactDef {
  id: ArtifactId
  name: string
  description: string
}

export const ARTIFACTS: ArtifactDef[] = [
  { id: 'cometShard', name: 'Осколок кометы', description: 'Удар бьёт втрое сильнее' },
  { id: 'iridiumVein', name: 'Жила иридия', description: 'Дроны копают вдвое быстрее' },
  { id: 'oldBlueprint', name: 'Старый чертёж', description: 'Здания дешевле на пятую часть' },
  { id: 'focusCrystal', name: 'Кристалл фокуса', description: 'Плавильни дают в полтора раза больше сплава' },
  { id: 'smuggledBooster', name: 'Контрабандный ускоритель', description: 'Реклама перезаряжается вдвое быстрее' },
  { id: 'darkSeed', name: 'Тёмное семя', description: 'Ядра ценятся заметно выше при перелёте' },
  { id: 'rustyExcavator', name: 'Ржавый экскаватор', description: 'Экскаваторы мощнее в 2,5 раза, зато дроны вполсилы' },
  { id: 'obsidianLens', name: 'Линза обсидиана', description: 'Лазеры бьют вдвое сильнее' },
  { id: 'hive', name: 'Улей', description: 'Каждые десять дронов добавляют 5 % ко всей добыче' },
  { id: 'voidSeal', name: 'Печать пустоты', description: 'Тёмная материя действует в полтора раза сильнее' },
  { id: 'lotteryTicket', name: 'Билет лотереи', description: 'События случаются вдвое чаще' },
  { id: 'minerHammer', name: 'Молот шахтёра', description: 'Первая сотня ударов забега бьёт вдесятеро' },
]

export const artifactDef = (id: ArtifactId): ArtifactDef => ARTIFACTS.find((a) => a.id === id)!

export function rerollArtifact(state: GameState, roll: number): GameState {
  let pool = ARTIFACTS.filter((a) => !state.artifactsSeen.includes(a.id) && a.id !== state.artifact)
  if (pool.length === 0) pool = ARTIFACTS.filter((a) => a.id !== state.artifact)
  const picked = pool[Math.min(pool.length - 1, Math.max(0, Math.floor(roll * pool.length)))]
  return {
    ...state,
    artifact: picked.id,
    artifactsSeen: state.artifactsSeen.includes(picked.id) ? state.artifactsSeen : [...state.artifactsSeen, picked.id],
  }
}

export function pickArtifact(state: GameState, roll: number): GameState {
  let pool = ARTIFACTS.filter((a) => !state.artifactsSeen.includes(a.id))
  let seen = state.artifactsSeen
  if (pool.length === 0) {
    pool = ARTIFACTS
    seen = []
  }
  const picked = pool[Math.min(pool.length - 1, Math.max(0, Math.floor(roll * pool.length)))]
  return { ...state, artifact: picked.id, artifactsSeen: [...seen, picked.id] }
}
