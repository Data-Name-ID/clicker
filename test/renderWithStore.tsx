import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { AdProvider, AdResult } from '../src/ads/AdProvider'
import { createGameStore, type GameStoreDeps } from '../src/store/gameStore'
import { GameStoreContext } from '../src/store/context'
import type { GameState } from '../src/game/types'
import { buildState, type StateOverrides } from './builders'
import { memoryStorage } from './memoryStorage'

export const stubAds = (result: AdResult = 'rewarded'): AdProvider => ({
  isAvailable: () => true,
  showRewarded: () => Promise.resolve(result),
})

export function makeStore(overrides: StateOverrides = {}, deps: GameStoreDeps = {}) {
  const store = createGameStore({ ads: stubAds(), storage: memoryStorage(), clock: () => 1_700_000_000_000, random: () => 0.5, ...deps })
  const game: GameState = buildState(overrides)
  store.setState({ game, now: 1_700_000_000_000, lastTick: 1_700_000_000_000 })
  return store
}

export function renderWithStore(ui: ReactElement, overrides: StateOverrides = {}, deps: GameStoreDeps = {}) {
  const store = makeStore(overrides, deps)
  const result = render(<GameStoreContext.Provider value={store}>{ui}</GameStoreContext.Provider>)
  return { store, ...result }
}
