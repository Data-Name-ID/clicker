import { SAVE_KEY } from '../game/save'

export interface SaveStorage {
  read(): string | null
  write(json: string): void
  clear(): void
}

const attempt = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const localSaveStorage: SaveStorage = {
  read: () => attempt(() => localStorage.getItem(SAVE_KEY), null),
  write: (json) => attempt(() => localStorage.setItem(SAVE_KEY, json), undefined),
  clear: () => attempt(() => localStorage.removeItem(SAVE_KEY), undefined),
}
