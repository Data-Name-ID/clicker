import type { useGameStore } from './gameStore'

export const TICK_INTERVAL_MS = 100
export const AUTOSAVE_INTERVAL_MS = 10_000
export const IDLE_TITLE_DELAY_MS = 5 * 60 * 1000
export const IDLE_TITLE = 'Астероид скучает…'

export function startGameLoop(store: typeof useGameStore): () => void {
  store.getState().load(Date.now())
  const tick = setInterval(() => store.getState().tick(Date.now()), TICK_INTERVAL_MS)
  const autosave = setInterval(() => store.getState().save(Date.now()), AUTOSAVE_INTERVAL_MS)
  const saveNow = () => store.getState().save(Date.now())
  const baseTitle = document.title
  let idleTimer: ReturnType<typeof setTimeout> | null = null
  const onVisibility = () => {
    if (document.hidden) {
      saveNow()
      idleTimer = setTimeout(() => {
        document.title = IDLE_TITLE
      }, IDLE_TITLE_DELAY_MS)
    } else {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = null
      document.title = baseTitle
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('beforeunload', saveNow)
  return () => {
    clearInterval(tick)
    clearInterval(autosave)
    if (idleTimer) clearTimeout(idleTimer)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('beforeunload', saveNow)
  }
}
