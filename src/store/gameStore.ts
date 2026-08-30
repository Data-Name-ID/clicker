import { create } from 'zustand'
import { adProvider as defaultAdProvider } from '../ads'
import type { AdPlacement, AdProvider } from '../ads/AdProvider'
import { grantAchievements, newAchievements } from '../game/achievements'
import { achievementDef } from '../game/content/achievements'
import { applyClick, buyBuilding, buyUpgrade } from '../game/economy'
import { applyPrestige, bonusDarkMatterGain, canPrestige, darkMatterGain } from '../game/prestige'
import {
  applyBoost,
  applyMeteorShower,
  applyOfflineDouble,
  applySupply,
  cooldownRemaining,
  recordAdWatched,
} from '../game/rewards'
import { SaveError, applyOffline, decodeImport, deserialize, encodeExport, serialize } from '../game/save'
import { simulateChunked } from '../game/tick'
import { dismissTutorial, markTutorialSeen, type TutorialStepId } from '../game/tutorial'
import { createInitialState, type BuildingId, type GameState, type Resources, type UpgradeId } from '../game/types'
import { localSaveStorage, type SaveStorage } from './storage'

export const FROZEN_TAB_SECONDS = 300
export const TICK_CHUNK_SECONDS = 60

export type ToastKind = 'achievement' | 'info' | 'error'

export type TabId = 'buildings' | 'upgrades' | 'achievements' | 'prestige' | 'settings'

export interface Toast {
  id: number
  kind: ToastKind
  title: string
  text?: string
}

export interface OfflineSummary {
  elapsed: number
  gains: Resources
}

export interface GameStore {
  game: GameState
  now: number
  lastTick: number
  toasts: Toast[]
  offline: OfflineSummary | null
  adBusy: AdPlacement | null
  tab: TabId
  tourAck: TutorialStepId | null
  started: boolean
  click(): void
  buy(id: BuildingId, count: number | 'max'): void
  buyUpgrade(id: UpgradeId): void
  prestige(): void
  tick(now: number): void
  watchAd(placement: AdPlacement): Promise<void>
  load(now: number): void
  save(now: number): void
  reset(): void
  exportSave(): string
  importSave(text: string): void
  closeOffline(): void
  dismissTutorial(): void
  ackTutorial(step: TutorialStepId | null): void
  seeTutorial(step: TutorialStepId): void
  setTab(tab: TabId): void
  start(): void
  notify(kind: ToastKind, title: string, text?: string): void
  dismissToast(id: number): void
}

export interface GameStoreDeps {
  ads?: AdProvider
  storage?: SaveStorage
  clock?: () => number
}

export function createGameStore({
  ads = defaultAdProvider,
  storage = localSaveStorage,
  clock = () => Date.now(),
}: GameStoreDeps = {}) {
  let toastSeq = 0

  return create<GameStore>()((set, get) => {
    const pushToast = (kind: ToastKind, title: string, text?: string) => {
      toastSeq += 1
      set((s) => ({ toasts: [...s.toasts, { id: toastSeq, kind, title, text }] }))
    }

    const commit = (game: GameState, extra: Partial<GameStore> = {}) => {
      const earned = newAchievements(game)
      set({ game: grantAchievements(game, earned), ...extra })
      for (const id of earned) {
        const def = achievementDef(id)
        pushToast('achievement', `Достижение: ${def.name}`, def.description)
      }
    }

    const arrive = (saved: GameState, now: number) => {
      const result = applyOffline(saved, now)
      commit(result.state, {
        offline: result.elapsed > 0 ? { elapsed: result.elapsed, gains: result.gains } : null,
        lastTick: now,
        now,
      })
    }

    const fresh = (now: number) =>
      set({ game: createInitialState(), offline: null, lastTick: now, now })

    return {
      game: createInitialState(),
      now: 0,
      lastTick: 0,
      toasts: [],
      offline: null,
      adBusy: null,
      tab: 'buildings',
      tourAck: null,
      started: false,

      click: () => commit(applyClick(get().game)),

      buy: (id, count) => {
        const next = buyBuilding(get().game, id, count)
        if (next) commit(next)
      },

      buyUpgrade: (id) => {
        const next = buyUpgrade(get().game, id)
        if (next) commit(next)
      },

      prestige: () => {
        const { game } = get()
        if (!canPrestige(game)) return
        const gain = darkMatterGain(game)
        commit(applyPrestige(game, gain))
        pushToast('info', 'Перелёт завершён', `+${gain} тёмной материи`)
      },

      tick: (now) => {
        const { game, lastTick } = get()
        const dt = (now - lastTick) / 1000
        if (dt <= 0) {
          set({ now })
          return
        }
        if (dt > FROZEN_TAB_SECONDS) {
          arrive({ ...game, savedAt: lastTick }, now)
          return
        }
        commit(simulateChunked(game, dt, TICK_CHUNK_SECONDS), { lastTick: now, now })
      },

      watchAd: async (placement) => {
        const { game, adBusy } = get()
        const now = clock()
        if (adBusy || !ads.isAvailable(placement) || cooldownRemaining(game, placement, now) > 0) return
        if (placement === 'prestigeBonus' && !canPrestige(game)) return
        if (placement === 'offlineDouble' && !get().offline) return
        set({ adBusy: placement })
        const result = await ads.showRewarded(placement)
        set({ adBusy: null })
        if (result === 'failed') pushToast('error', 'Реклама недоступна')
        if (result !== 'rewarded') return

        const current = recordAdWatched(get().game)
        const at = clock()
        switch (placement) {
          case 'boost':
            commit(applyBoost(current, at))
            pushToast('info', 'Перегрузка реактора', 'Всё производство ×2 на 10 минут')
            break
          case 'supply':
            commit(applySupply(current, at))
            pushToast('info', 'Экстренная поставка', 'Получены ресурсы за 30 минут')
            break
          case 'meteorShower':
            commit(applyMeteorShower(current, at))
            pushToast('info', 'Метеоритный дождь', 'Клик ×10 на 30 секунд')
            break
          case 'offlineDouble': {
            const gains = get().offline?.gains ?? { ore: 0, alloy: 0, chip: 0 }
            commit(applyOfflineDouble(current, gains), { offline: null })
            break
          }
          case 'prestigeBonus': {
            const gain = bonusDarkMatterGain(current)
            commit(applyPrestige(current, gain))
            pushToast('info', 'Перелёт с бонусом', `+${gain} тёмной материи`)
            break
          }
        }
      },

      load: (now) => {
        const raw = storage.read()
        if (!raw) {
          fresh(now)
          return
        }
        try {
          arrive(deserialize(raw), now)
        } catch (error) {
          fresh(now)
          pushToast('error', 'Сохранение повреждено', error instanceof SaveError ? error.message : undefined)
        }
      },

      save: (now) => {
        storage.write(serialize(get().game, now))
      },

      reset: () => {
        storage.clear()
        fresh(clock())
      },

      exportSave: () => encodeExport(get().game, clock()),

      importSave: (text) => {
        const imported = decodeImport(text)
        const now = clock()
        arrive(imported, now)
        storage.write(serialize(get().game, now))
        pushToast('info', 'Сохранение загружено')
      },

      closeOffline: () => set({ offline: null }),

      dismissTutorial: () => set({ game: dismissTutorial(get().game) }),

      ackTutorial: (step) => set({ tourAck: step }),

      seeTutorial: (step) => set({ game: markTutorialSeen(get().game, step) }),

      setTab: (tab) => set({ tab }),

      start: () => set({ started: true }),

      notify: pushToast,

      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }
  })
}

export const useGameStore = createGameStore()
