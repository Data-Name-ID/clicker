import { create } from 'zustand'
import { adProvider as defaultAdProvider } from '../ads'
import type { AdPlacement, AdProvider } from '../ads/AdProvider'
import { grantAchievements, newAchievements } from '../game/achievements'
import { achievementDef } from '../game/content/achievements'
import { pickArtifact, rerollArtifact, artifactDef } from '../game/content/artifacts'
import { eventDef } from '../game/content/events'
import { buyShipUpgrade, shipUpgradeDef } from '../game/content/ship'
import { buyTalent, talentLevel } from '../game/content/talents'
import { challengeDef } from '../game/content/challenges'
import { availableUpgrades } from '../game/content/upgrades'
import {
  applyGalaxyReset,
  canGalaxyReset,
  challengeOutcomeOnPrestige,
  exitChallenge,
  settleChallenge,
  shardsGain,
  startChallenge,
} from '../game/galaxy'
import { collectExpedition, startExpedition } from '../game/expeditions'
import { applyDischarge, buyBuilding, buyUpgrade, canAfford, costOf, isBuildingVisible, performClick, setProtocol } from '../game/economy'
import { BUILDING_IDS } from '../game/content/buildings'
import { checkQuests } from '../game/quests'
import {
  acceptBlackMarket,
  acceptCaravan,
  declineOffer as declineOfferState,
  addResources,
  catchCat,
  catchComet,
  catchMeteor,
  catchStrayDrone,
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
  type ChallengeId,
  type ExpeditionKind,
  type ProtocolId,
  type Resources,
  type ShipUpgradeId,
  type TalentId,
  type ThemeId,
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

export interface ClickFeedback {
  gain: number
  crit: boolean
  combo: number
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
  shakeSeq: number
  autoBuyerOn: boolean
  click(rhythmBonus?: boolean): ClickFeedback
  discharge(): void
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
  setTheme(theme: ThemeId): void
  setAsteroidSkin(skin: number | null): void
  galaxyReset(): void
  buyTalent(id: TalentId): void
  startChallenge(id: ChallengeId): void
  exitChallenge(): void
  setAutoPrestigeAt(value: number): void
  setAutoBuyer(on: boolean): void
  startExpedition(kind: ExpeditionKind, drones: number): void
  collectExpedition(index: number): void
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
      const quests = checkQuests(game)
      const earned = newAchievements(quests.state)
      set({ game: grantAchievements(quests.state, earned), ...extra })
      for (const done of quests.completed) {
        pushToast('info', `Задание: ${done.name}`, done.rewardText)
      }
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

    const doPrestige = (game: GameState, gain: number) => {
      const now = clock()
      const outcome = challengeOutcomeOnPrestige(game, now)
      let after = applyPrestige(game, gain, now)
      if (outcome) {
        after = settleChallenge(after, outcome)
      } else {
        after = pickArtifact(after, random())
      }
      commit(after)
      pushToast('info', 'Перелёт завершён', `+${gain} тёмной материи`)
      if (outcome) {
        if (outcome.success) {
          pushToast('event', `Испытание «${outcome.name}» пройдено`, outcome.shards > 0 ? `+${outcome.shards} осколков` : 'Награда уже получена')
        } else {
          pushToast('error', `Испытание «${outcome.name}» провалено`, 'Время вышло')
        }
      } else if (after.artifact) {
        const def = artifactDef(after.artifact)
        pushToast('event', `Артефакт: ${def.name}`, def.description)
      }
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
      shakeSeq: 0,
      autoBuyerOn: true,

      click: (rhythmBonus = false) => {
        const result = performClick(get().game, clock(), random(), rhythmBonus ? 2 : 1)
        commit(result.state)
        return { gain: result.gain, crit: result.crit, combo: result.combo }
      },

      discharge: () => {
        const before = get().game
        const next = applyDischarge(before)
        if (next === before) return
        commit(next, { shakeSeq: get().shakeSeq + 1 })
        pushToast('info', 'РАЗРЯД!', `+${Math.round(next.resources.ore - before.resources.ore)} руды за 60 секунд производства`)
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
        doPrestige(game, darkMatterGain(game))
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
        if (talentLevel(next, 'autoEvents') > 0) {
          if (next.effects.event?.id === 'caravan') next = acceptCaravan(next)
          else if (next.effects.event?.id === 'blackMarket') next = acceptBlackMarket(next)
        }
        if (talentLevel(next, 'autoBuyer') > 0 && get().autoBuyerOn) {
          let cheapest: { id: (typeof BUILDING_IDS)[number]; weight: number } | null = null
          for (const id of BUILDING_IDS) {
            if (!isBuildingVisible(next, id)) continue
            const cost = costOf(next, id, next.buildings[id], 1)
            if (!canAfford(next.resources, cost)) continue
            const weight = (cost.ore ?? 0) + (cost.alloy ?? 0) * 4 + (cost.chip ?? 0) * 20 + (cost.core ?? 0) * 400
            if (!cheapest || weight < cheapest.weight) cheapest = { id, weight }
          }
          if (cheapest) next = buyBuilding(next, cheapest.id, 1) ?? next
        }
        if (talentLevel(next, 'autoUpgrades') > 0) {
          const target = availableUpgrades(next).find((u) => canAfford(next.resources, u.cost))
          if (target) next = buyUpgrade(next, target.id) ?? next
        }
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
        const after = get().game
        if (
          talentLevel(after, 'autoPrestige') > 0 &&
          after.autoPrestigeAt > 0 &&
          canPrestige(after) &&
          darkMatterGain(after) >= after.autoPrestigeAt
        ) {
          doPrestige(after, darkMatterGain(after))
        }
      },

      watchAd: async (placement) => {
        const { game, adBusy } = get()
        const now = clock()
        if (game.challenge?.id === 'ascetic') return
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
            doPrestige(current, bonusDarkMatterGain(current))
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
        commit(declineOfferState(get().game))
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

      setTheme: (theme) => set({ game: { ...get().game, theme } }),

      setAsteroidSkin: (skin) => set({ game: { ...get().game, asteroidSkin: skin } }),

      galaxyReset: () => {
        const { game } = get()
        if (!canGalaxyReset(game)) return
        const gain = shardsGain(game)
        commit(applyGalaxyReset(game, clock()))
        pushToast('info', 'Межгалактический прыжок', `+${gain} осколков звёзд`)
      },

      buyTalent: (id) => {
        const next = buyTalent(get().game, id)
        if (next) commit(next)
      },

      startChallenge: (id) => {
        const { game } = get()
        if (game.challenge) return
        commit(startChallenge(game, id, clock()))
        pushToast('info', `Испытание: ${challengeDef(id).name}`, challengeDef(id).description)
      },

      exitChallenge: () => {
        const { game } = get()
        if (!game.challenge) return
        commit(exitChallenge(game, clock()))
        pushToast('info', 'Испытание прервано')
      },

      setAutoPrestigeAt: (value) => set({ game: { ...get().game, autoPrestigeAt: Math.max(0, value) } }),

      setAutoBuyer: (on) => set({ autoBuyerOn: on }),

      startExpedition: (kind, drones) => {
        const next = startExpedition(get().game, kind, drones, clock())
        if (!next) return
        commit(next)
        pushToast('info', 'Экспедиция отправлена', `${drones} дронов в пути`)
      },

      collectExpedition: (index) => {
        const result = collectExpedition(get().game, index, clock(), [random(), random()])
        if (!result) return
        commit(result.state)
        if (result.outcome === 'fail') {
          pushToast('error', 'Экспедиция провалилась', result.lostDrones > 0 ? `Потеряно дронов: ${result.lostDrones}` : 'Дроны спасены страховкой')
        } else if (result.outcome === 'rare') {
          pushToast('event', 'Редкая находка!', result.darkMatter > 0 ? `+${result.darkMatter} тёмной материи и ресурсы` : 'Ценные ресурсы на борту')
        } else {
          pushToast('info', 'Экспедиция вернулась', 'Трюмы полны руды')
        }
      },

      start: () => set({ started: true }),

      notify: pushToast,

      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }
  })
}

export const useGameStore = createGameStore()
