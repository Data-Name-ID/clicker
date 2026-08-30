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
    const store = makeStore({ darkMatter: 12 })

    store.getState().buyShip('startCargo')

    expect(store.getState().game.darkMatter).toBe(7)
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

describe('gameStore new ad placements', () => {
  it('rerolls the artifact for an ad', async () => {
    const store = makeStore({ artifact: 'cometShard', artifactsSeen: ['cometShard'] }, { ads: stubAds('rewarded') })

    await store.getState().watchAd('artifactReroll')

    expect(store.getState().game.artifact).not.toBe('cometShard')
    expect(store.getState().game.cooldowns.rerollUntil).toBe(NOW + 30 * 60 * 1000)
  })

  it('ignores the reroll without an artifact', async () => {
    const store = makeStore({}, { ads: stubAds('rewarded') })

    await store.getState().watchAd('artifactReroll')

    expect(store.getState().game.stats.adsWatched).toBe(0)
  })

  it('rushes a random event for an ad', async () => {
    const store = makeStore({}, { ads: stubAds('rewarded') })

    await store.getState().watchAd('eventRush')

    expect(store.getState().game.effects.event).not.toBeNull()
    expect(store.getState().game.cooldowns.eventRushUntil).toBe(NOW + 10 * 60 * 1000)
  })

  it('opens two cat boxes for an ad', async () => {
    const store = makeStore({}, { ads: stubAds('rewarded') })
    store.setState({ catBoxOpen: true })

    await store.getState().watchAd('catDouble')

    expect(store.getState().game.resources.alloy).toBe(40)
    expect(store.getState().catBoxOpen).toBe(false)
  })
})

describe('gameStore customization', () => {
  it('saves the theme and skin in the game state', () => {
    const store = makeStore()

    store.getState().setTheme('nebula')
    store.getState().setAsteroidSkin(2)

    expect(store.getState().game.theme).toBe('nebula')
    expect(store.getState().game.asteroidSkin).toBe(2)
  })
})

describe('gameStore discharge', () => {
  it('shakes the screen and pays out', () => {
    const store = makeStore({ buildings: { drone: 10 }, charge: 100 })

    store.getState().discharge()

    expect(store.getState().game.resources.ore).toBe(300)
    expect(store.getState().shakeSeq).toBe(1)
    expect(store.getState().toasts.map((t) => t.title)).toContain('РАЗРЯД!')
  })
})

describe('gameStore galaxy', () => {
  it('jumps and grants shards', () => {
    const store = makeStore({ prestigeCount: 5, darkMatter: 100, buildings: { drone: 40 } })

    store.getState().galaxyReset()

    expect(store.getState().game.shards).toBe(3)
    expect(store.getState().game.galaxyCount).toBe(1)
    expect(store.getState().game.darkMatter).toBe(0)
    expect(store.getState().toasts.map((t) => t.title)).toContain('Межгалактический прыжок')
  })

  it('settles a challenge on prestige', () => {
    const store = makeStore({ stats: { runChips: 10_000 }, challenge: { id: 'silence', startedAt: NOW - 1000 } })

    store.getState().prestige()

    expect(store.getState().game.challenge).toBeNull()
    expect(store.getState().game.shards).toBe(2)
    expect(store.getState().game.challengesDone).toEqual(['silence'])
  })

  it('blocks ads inside the ascetic challenge', async () => {
    const store = makeStore({ challenge: { id: 'ascetic', startedAt: NOW } }, { ads: stubAds('rewarded') })

    await store.getState().watchAd('boost')

    expect(store.getState().game.stats.adsWatched).toBe(0)
  })
})

describe('gameStore automation talents', () => {
  it('auto buyer purchases the cheapest building', () => {
    const store = makeStore({ resources: { ore: 20 }, talents: { autoBuyer: 1 }, eventCountdown: 100 })

    store.getState().tick(NOW + 1000)

    expect(store.getState().game.buildings.drone).toBe(1)
  })

  it('auto prestige fires at the configured reward', () => {
    const store = makeStore({
      stats: { runChips: 10_000 },
      talents: { autoPrestige: 1 },
      autoPrestigeAt: 3,
      eventCountdown: 100,
    })

    store.getState().tick(NOW + 1000)

    expect(store.getState().game.prestigeCount).toBe(1)
    expect(store.getState().game.darkMatter).toBe(3)
  })
})

describe('gameStore expeditions', () => {
  it('starts and collects an expedition', () => {
    const store = makeStore({ buildings: { drone: 30 }, eventCountdown: 100 })

    store.getState().startExpedition('short', 10)
    expect(store.getState().game.expeditions).toHaveLength(1)

    store.setState({ game: { ...store.getState().game, expeditions: [{ kind: 'short', drones: 10, endsAt: NOW - 1 }] } })
    store.getState().collectExpedition(0)

    expect(store.getState().game.expeditions).toHaveLength(0)
    expect(store.getState().game.stats.expeditionsDone).toBe(1)
    expect(store.getState().game.resources.ore).toBeGreaterThan(0)
  })
})
