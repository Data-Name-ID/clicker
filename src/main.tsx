import '@fontsource/press-start-2p'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useGameStore } from './store/gameStore'
import { startGameLoop } from './store/loop'
import { App } from './ui/App'
import './ui/styles.css'

startGameLoop(useGameStore)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
