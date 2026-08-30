import type { ArtifactId, GameState } from '../types'

export interface ArtifactDef {
  id: ArtifactId
  name: string
  description: string
}

export const ARTIFACTS: ArtifactDef[] = [
  { id: 'cometShard', name: 'Осколок кометы', description: 'Клик ×3' },
  { id: 'iridiumVein', name: 'Жила иридия', description: 'Дроны ×2' },
  { id: 'oldBlueprint', name: 'Старый чертёж', description: 'Здания на 20 % дешевле' },
  { id: 'focusCrystal', name: 'Кристалл фокуса', description: 'Плавильни: выход ×1,5' },
  { id: 'smuggledBooster', name: 'Контрабандный ускоритель', description: 'Кулдауны рекламы ×0,5' },
  { id: 'darkSeed', name: 'Тёмное семя', description: 'Ядра в формуле тёмной материи ценнее (÷35 вместо ÷50)' },
  { id: 'rustyExcavator', name: 'Ржавый экскаватор', description: 'Экскаваторы ×2,5, но дроны ×0,5' },
  { id: 'obsidianLens', name: 'Линза обсидиана', description: 'Лазеры ×2' },
  { id: 'hive', name: 'Улей', description: '+5 % всей добычи за каждые 10 дронов' },
  { id: 'voidSeal', name: 'Печать пустоты', description: 'Пассивный бонус тёмной материи ×1,5' },
  { id: 'lotteryTicket', name: 'Билет лотереи', description: 'События в 2 раза чаще' },
  { id: 'minerHammer', name: 'Молот шахтёра', description: 'Первые 100 кликов забега ×10' },
]

export const artifactDef = (id: ArtifactId): ArtifactDef => ARTIFACTS.find((a) => a.id === id)!

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
