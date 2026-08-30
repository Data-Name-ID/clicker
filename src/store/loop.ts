import type { useGameStore } from './gameStore'

export const TICK_INTERVAL_MS = 100
export const AUTOSAVE_INTERVAL_MS = 10_000

export function startGameLoop(store: typeof useGameStore): () => void {
  store.getState().load(Date.now())
  const tick = setInterval(() => store.getState().tick(Date.now()), TICK_INTERVAL_MS)
  const autosave = setInterval(() => store.getState().save(Date.now()), AUTOSAVE_INTERVAL_MS)
  const saveNow = () => store.getState().save(Date.now())
  const onVisibility = () => {
    if (document.hidden) saveNow()
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('beforeunload', saveNow)
  return () => {
    clearInterval(tick)
    clearInterval(autosave)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('beforeunload', saveNow)
  }
}
