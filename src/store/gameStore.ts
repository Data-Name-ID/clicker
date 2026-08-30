import { create } from 'zustand'
import { adProvider as defaultAdProvider } from '../ads'
import type { AdPlacement, AdProvider } from '../ads/AdProvider'
import { grantAchievements, newAchievements } from '../game/achievements'
import { achievementDef } from '../game/content/achievements'
import { pickArtifact, rerollArtifact, artifactDef } from '../game/content/artifacts'
import { eventDef } from '../game/content/events'
import { buyShipUpgrade, shipUpgradeDef } from '../game/content/ship'
import { applyClick, buyBuilding, buyUpgrade, setProtocol } from '../game/economy'
import {
  acceptBlackMarket,
  acceptCaravan,
  addResources,
  catchCat,
  catchComet,
  catchMeteor,
  catchStrayDrone,
  clearEvent,
  isMeteorShowerActive,
  nextCatDelay,
  nextEventDelay,
  openCatBox,
  startRandomEvent,
  tickEvents,
  tickLive,
  useDisco,
} from '../game/events'
import { applyPrestige, bonusDarkMatterGain, canPrestige, darkMatterGain } from '../game/prestige'
import {
  applyArtifactRerollCooldown,
  applyAutoDrill,
  applyBoost,
  applyEventRushCooldown,
  applyMeteorShower,
  applyOfflineDouble,
  applySupply,
  cooldownRemaining,
  recordAdWatched,
} from '../game/rewards'
import { SaveError, applyOffline, decodeImport, deserialize, encodeExport, serialize } from '../game/save'
import { simulateChunked } from '../game/tick'
import { dismissTutorial, markTutorialSeen, type TutorialStepId } from '../game/tutorial'
import {
  createInitialState,
  zeroResources,
  type BuildingId,
  type GameState,
  type ProtocolId,
  type Resources,
  type ShipUpgradeId,
  type UpgradeId,
} from '../game/types'
import { localSaveStorage, type SaveStorage } from './storage'

export const FROZEN_TAB_SECONDS = 300
export const TICK_CHUNK_SECONDS = 60
export const DISCO_DURATION_MS = 10_000

export type ToastKind = 'achievement' | 'info' | 'error' | 'event'

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
  catVisible: boolean
  catBoxOpen: boolean
  discoUntil: number
  click(rhythmBonus?: boolean): void
  buy(id: BuildingId, count: number | 'max'): void
  buyUpgrade(id: UpgradeId): void
  buyShip(id: ShipUpgradeId): void
  switchProtocol(protocol: ProtocolId): void
  prestige(): void
  tick(now: number): void
  watchAd(placement: AdPlacement): Promise<void>
  acceptOffer(): void
  declineOffer(): void
  clickComet(): void
  clickStrayDrone(): void
  clickMeteor(): void
  clickCat(): void
  chooseCatBox(): void
  triggerDisco(): void
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
  random?: () => number
}

export function createGameStore({
  ads = defaultAdProvider,
  storage = localSaveStorage,
  clock = () => Date.now(),
  random = Math.random,
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

    const fresh = (now: number) => {
      const game: GameState = {
        ...createInitialState(),
        eventCountdown: nextEventDelay(createInitialState(), random()),
        catCountdown: nextCatDelay(random()),
      }
      game.stats.runStartedAt = now
      set({ game, offline: null, lastTick: now, now, catVisible: false, catBoxOpen: false })
    }

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
      catVisible: false,
      catBoxOpen: false,
      discoUntil: 0,

      click: (rhythmBonus = false) => {
        let game = applyClick(get().game, clock())
        if (rhythmBonus) game = applyClick(game, clock())
        commit(game)
      },

      buy: (id, count) => {
        const before = get().game
        const next = buyBuilding(before, id, count)
        if (!next) return
        commit(next)
        if (id === 'drone' && before.buildings.drone < 100 && next.buildings.drone >= 100) {
          pushToast('info', 'Дрон №100 просит выходной', 'Отказано. Норма — 24/7.')
        }
      },

      buyUpgrade: (id) => {
        const next = buyUpgrade(get().game, id)
        if (next) commit(next)
      },

      buyShip: (id) => {
        const next = buyShipUpgrade(get().game, id)
        if (!next) return
        commit(next)
        pushToast('info', 'Корабль улучшен', shipUpgradeDef(id).name)
      },

      switchProtocol: (protocol) => {
        commit(setProtocol(get().game, protocol))
      },

      prestige: () => {
        const { game } = get()
        if (!canPrestige(game)) return
        const gain = darkMatterGain(game)
        const after = pickArtifact(applyPrestige(game, gain, clock()), random())
        commit(after)
        pushToast('info', 'Перелёт завершён', `+${gain} тёмной материи`)
        if (after.artifact) {
          const def = artifactDef(after.artifact)
          pushToast('event', `Артефакт: ${def.name}`, def.description)
        }
      },

      tick: (now) => {
        const { game, lastTick, catVisible, discoUntil } = get()
        const dt = (now - lastTick) / 1000
        if (dt <= 0) {
          set({ now })
          return
        }
        if (dt > FROZEN_TAB_SECONDS) {
          arrive({ ...game, savedAt: lastTick }, now)
          return
        }
        let next = simulateChunked(game, dt, TICK_CHUNK_SECONDS)
        next = applyAutoDrill(next, dt)
        next = tickLive(next, dt, new Date(now).getHours())
        const eventResult = tickEvents(next, dt, [random(), random()])
        next = eventResult.state
        const extra: Partial<GameStore> = { lastTick: now, now }
        if (next.catCountdown <= 0 && !catVisible && !get().catBoxOpen) {
          extra.catVisible = true
          next = { ...next, catCountdown: nextCatDelay(random()) }
        }
        if (discoUntil > 0 && now > discoUntil) extra.discoUntil = 0
        commit(next, extra)
        if (eventResult.started) {
          const def = eventDef(eventResult.started)
          pushToast('event', def.name, def.description)
        }
      },

      watchAd: async (placement) => {
        const { game, adBusy } = get()
        const now = clock()
        if (adBusy || !ads.isAvailable(placement) || cooldownRemaining(game, placement, now) > 0) return
        if (placement === 'prestigeBonus' && !canPrestige(game)) return
        if (placement === 'offlineDouble' && !get().offline) return
        if (placement === 'artifactReroll' && !game.artifact) return
        if (placement === 'eventRush' && game.effects.event) return
        if (placement === 'catDouble' && !get().catBoxOpen) return
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
            pushToast('info', 'Перегрузка реактора', 'Всё производство ×2')
            break
          case 'supply':
            commit(applySupply(current, at))
            pushToast('info', 'Экстренная поставка', 'Ресурсы получены')
            break
          case 'meteorShower':
            commit(applyMeteorShower(current, at))
            pushToast('info', 'Метеоритный дождь', 'Клик ×10 — лови метеоры!')
            break
          case 'offlineDouble': {
            const gains = get().offline?.gains ?? zeroResources()
            commit(applyOfflineDouble(current, gains), { offline: null })
            break
          }
          case 'artifactReroll': {
            const next = applyArtifactRerollCooldown(rerollArtifact(current, random()), at)
            commit(next)
            if (next.artifact) {
              const def = artifactDef(next.artifact)
              pushToast('event', `Артефакт: ${def.name}`, def.description)
            }
            break
          }
          case 'eventRush': {
            const rushed = startRandomEvent(current, [random(), random()])
            commit(applyEventRushCooldown(rushed.state, at))
            if (rushed.started) {
              const def = eventDef(rushed.started)
              pushToast('event', def.name, def.description)
            }
            break
          }
          case 'catDouble': {
            const first = openCatBox(current, random())
            const afterFirst = addResources(current, first.delta)
            const second = openCatBox(afterFirst, random())
            commit(addResources(afterFirst, second.delta), { catBoxOpen: false })
            pushToast('event', 'Посылка от кота ×2', `${first.text} ${second.text}`)
            break
          }
          case 'prestigeBonus': {
            const gain = bonusDarkMatterGain(current)
            const after = pickArtifact(applyPrestige(current, gain, at), random())
            commit(after)
            pushToast('info', 'Перелёт с бонусом', `+${gain} тёмной материи`)
            if (after.artifact) {
              const def = artifactDef(after.artifact)
              pushToast('event', `Артефакт: ${def.name}`, def.description)
            }
            break
          }
        }
      },

      acceptOffer: () => {
        const { game } = get()
        const id = game.effects.event?.id
        if (id === 'caravan') commit(acceptCaravan(game))
        else if (id === 'blackMarket') commit(acceptBlackMarket(game))
      },

      declineOffer: () => {
        commit(clearEvent(get().game))
      },

      clickComet: () => {
        const { game } = get()
        if (game.effects.event?.id !== 'comet') return
        commit(catchComet(game))
        pushToast('event', 'Комета поймана!', '+10 минут добычи руды')
      },

      clickStrayDrone: () => {
        const { game } = get()
        if (game.effects.event?.id !== 'strayDrone') return
        commit(catchStrayDrone(game))
        pushToast('event', 'Дрон присоединился', '+1 бесплатный дрон')
      },

      clickMeteor: () => {
        const { game } = get()
        if (!isMeteorShowerActive(game)) return
        commit(catchMeteor(game))
      },

      clickCat: () => {
        if (!get().catVisible) return
        commit(catchCat(get().game), { catVisible: false, catBoxOpen: true })
      },

      chooseCatBox: () => {
        const { game, catBoxOpen } = get()
        if (!catBoxOpen) return
        const reward = openCatBox(game, random())
        commit(addResources(game, reward.delta), { catBoxOpen: false })
        pushToast('event', 'Посылка от кота', reward.text)
      },

      triggerDisco: () => {
        const now = clock()
        commit(useDisco(get().game), { discoUntil: now + DISCO_DURATION_MS })
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
