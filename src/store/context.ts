import { createContext, useContext } from 'react'
import { useGameStore, type GameStore } from './gameStore'

export type GameStoreHook = typeof useGameStore

export const GameStoreContext = createContext<GameStoreHook>(useGameStore)

export function useGame<T>(selector: (state: GameStore) => T): T {
  const store = useContext(GameStoreContext)
  return store(selector)
}

export const useGameApi = (): GameStoreHook => useContext(GameStoreContext)
