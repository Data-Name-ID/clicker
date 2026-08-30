import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { memoryStorage } from '../../test/memoryStorage'
import { makeStore, stubAds } from '../../test/renderWithStore'
import { serialize } from '../game/save'

const NOW = 1_700_000_000_000

describe('gameStore.tick', () => {
  it('advances the simulation by the elapsed time', () => {
    const store = makeStore({ buildings: { drone: 10 } })

    store.getState().tick(NOW + 2000)

    expect(store.getState().game.resources.ore).toBe(10)
    expect(store.getState().offline).toBeNull()
  })

  it('treats a gap over 5 minutes as an offline return', () => {
    const store = makeStore({ buildings: { drone: 10 } })

    store.getState().tick(NOW + 400_000)

    expect(store.getState().game.resources.ore).toBe(2000)
    expect(store.getState().offline).toEqual({ elapsed: 400, gains: { ore: 2000, alloy: 0, chip: 0, core: 0 } })
  })
})

describe('gameStore.watchAd', () => {
  it('applies the boost and counts the ad when rewarded', async () => {
    const store = makeStore({}, { ads: stubAds('rewarded') })

    await store.getState().watchAd('boost')

    expect(store.getState().game.effects.boostRemaining).toBe(600)
    expect(store.getState().game.stats.adsWatched).toBe(1)
    expect(store.getState().game.cooldowns.boostUntil).toBe(NOW + 40 * 60 * 1000)
  })

  it('does nothing when dismissed', async () => {
    const store = makeStore({}, { ads: stubAds('dismissed') })

    await store.getState().watchAd('boost')

    expect(store.getState().game.effects.boostRemaining).toBe(0)
    expect(store.getState().game.stats.adsWatched).toBe(0)
  })

  it('ignores a placement on cooldown', async () => {
    const store = makeStore({ cooldowns: { boostUntil: NOW + 1000 } }, { ads: stubAds('rewarded') })

    await store.getState().watchAd('boost')

    expect(store.getState().game.effects.boostRemaining).toBe(0)
  })

  it('doubles offline gains once and closes the modal', async () => {
    const store = makeStore({ resources: { ore: 100 } }, { ads: stubAds('rewarded') })
    store.setState({ offline: { elapsed: 600, gains: { ore: 100, alloy: 0, chip: 0, core: 0 } } })

    await store.getState().watchAd('offlineDouble')

    expect(store.getState().game.resources.ore).toBe(200)
    expect(store.getState().offline).toBeNull()
  })

  it('prestiges with the bonus reward', async () => {
    const store = makeStore({ stats: { runChips: 10_000 } }, { ads: stubAds('rewarded') })

    await store.getState().watchAd('prestigeBonus')

    expect(store.getState().game.darkMatter).toBe(4)
    expect(store.getState().game.prestigeCount).toBe(1)
  })
})

describe('gameStore.load', () => {
  it('restores the save and reports offline progress', () => {
    const saved = buildState({ buildings: { drone: 10 } })
    const store = makeStore({}, { storage: memoryStorage(serialize(saved, NOW - 3_600_000)) })

    store.getState().load(NOW)

    expect(store.getState().game.resources.ore).toBe(18_000)
    expect(store.getState().offline?.elapsed).toBe(3600)
  })

  it('starts fresh with an error toast on a corrupt save', () => {
    const store = makeStore({}, { storage: memoryStorage('garbage') })

    store.getState().load(NOW)

    expect(store.getState().game.resources.ore).toBe(0)
    expect(store.getState().toasts.map((t) => t.title)).toEqual(['Сохранение повреждено'])
  })
})

describe('gameStore achievements', () => {
  it('grants an achievement once with a toast', () => {
    const store = makeStore({ stats: { clicks: 99 } })

    store.getState().click()
    store.getState().click()

    expect(store.getState().game.achievements).toEqual(['clicks100'])
    expect(store.getState().toasts.map((t) => t.title)).toEqual(['Достижение: Мозоль'])
  })
})

describe('gameStore.importSave', () => {
  it('replaces the game and persists it', () => {
    const storage = memoryStorage()
    const store = makeStore({}, { storage })
    const exported = makeStore({ darkMatter: 7 }).getState().exportSave()

    store.getState().importSave(exported)

    expect(store.getState().game.darkMatter).toBe(7)
    expect(storage.value).not.toBeNull()
  })
})

describe('gameStore ship shop', () => {
  it('buys a ship upgrade and spends dark matter', () => {
    const store = makeStore({ darkMatter: 5 })

    store.getState().buyShip('startCargo')

    expect(store.getState().game.darkMatter).toBe(3)
    expect(store.getState().game.shipUpgrades).toEqual(['startCargo'])
    expect(store.getState().toasts.map((t) => t.title)).toContain('Корабль улучшен')
  })
})

describe('gameStore events', () => {
  it('starts an event from the tick and announces it', () => {
    const store = makeStore()

    store.getState().tick(NOW + 1000)

    expect(store.getState().game.effects.event?.id).toBe('comet')
    expect(store.getState().toasts.map((t) => t.title)).toContain('Пролетающая комета')
  })

  it('rewards a caught comet', () => {
    const store = makeStore({ buildings: { drone: 10 }, effects: { event: { id: 'comet', remaining: 5 } } })

    store.getState().clickComet()

    expect(store.getState().game.resources.ore).toBe(3000)
    expect(store.getState().game.effects.event).toBeNull()
  })
})

describe('gameStore cat', () => {
  it('catches the cat and opens the box choice', () => {
    const store = makeStore()
    store.setState({ catVisible: true })

    store.getState().clickCat()

    expect(store.getState().game.stats.caughtCat).toBe(true)
    expect(store.getState().catBoxOpen).toBe(true)
    expect(store.getState().toasts.map((t) => t.title)).toContain('Достижение: Мяу')
  })

  it('opens a box and applies the reward', () => {
    const store = makeStore()
    store.setState({ catBoxOpen: true })

    store.getState().chooseCatBox()

    expect(store.getState().game.resources.alloy).toBe(20)
    expect(store.getState().catBoxOpen).toBe(false)
  })
})

describe('gameStore disco', () => {
  it('marks the secret and sets the timer', () => {
    const store = makeStore()

    store.getState().triggerDisco()

    expect(store.getState().game.stats.discoUsed).toBe(true)
    expect(store.getState().discoUntil).toBe(NOW + 10_000)
    expect(store.getState().toasts.map((t) => t.title)).toContain('Достижение: Диско')
  })
})

describe('gameStore auto drill', () => {
  it('adds ore in the live tick only', () => {
    const store = makeStore({ shipUpgrades: ['autoDrill'], eventCountdown: 100 })

    store.getState().tick(NOW + 2000)

    expect(store.getState().game.resources.ore).toBe(2)
    expect(store.getState().game.stats.noClickSeconds).toBe(2)
  })
})
