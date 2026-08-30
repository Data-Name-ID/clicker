import { useEffect } from 'react'
import { TAB_ICONS } from '../assets/sprites'
import { useGame } from '../store/context'
import type { TabId } from '../store/gameStore'
import { AchievementList } from './AchievementList'
import { AdModal } from './AdModal'
import { Asteroid } from './Asteroid'
import { BuildingList } from './BuildingList'
import { CatOverlay } from './CatOverlay'
import { EventBanner } from './EventBanner'
import { EventOverlays } from './EventOverlays'
import { MeteorShower } from './MeteorShower'
import { OfflineModal } from './OfflineModal'
import { PrestigePanel } from './PrestigePanel'
import { ResourceBar } from './ResourceBar'
import { SettingsPanel } from './SettingsPanel'
import { StartScreen } from './StartScreen'
import { Toasts } from './Toast'
import { Tutorial } from './Tutorial'
import { UpgradeList } from './UpgradeList'

const TABS: { id: TabId; label: string }[] = [
  { id: 'buildings', label: 'Здания' },
  { id: 'upgrades', label: 'Улучшения' },
  { id: 'achievements', label: 'Достижения' },
  { id: 'prestige', label: 'Перелёт' },
  { id: 'settings', label: 'Настройки' },
]

const PANELS: Record<TabId, () => React.JSX.Element> = {
  buildings: BuildingList,
  upgrades: UpgradeList,
  achievements: AchievementList,
  prestige: PrestigePanel,
  settings: SettingsPanel,
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export function App() {
  const tab = useGame((s) => s.tab)
  const setTab = useGame((s) => s.setTab)
  const triggerDisco = useGame((s) => s.triggerDisco)

  useEffect(() => {
    let position = 0
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      position = key === KONAMI[position] ? position + 1 : key === KONAMI[0] ? 1 : 0
      if (position === KONAMI.length) {
        position = 0
        triggerDisco()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [triggerDisco])
  const Panel = PANELS[tab]

  return (
    <div className="app">
      <ResourceBar />
      <EventBanner />
      <main className="layout">
        <Asteroid />
        <div className="side">
          <section className="tabs-panel frame">
            <h2 className="tabs-panel__title">{TABS.find((t) => t.id === tab)!.label}</h2>
            <div className="tab-content" role="tabpanel">
              <Panel />
            </div>
          </section>
          <nav className="tabs" role="tablist" aria-label="Разделы">
            {TABS.map((t) => (
              <button
                type="button"
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`tab ${tab === t.id ? 'tab--on' : ''}`}
                data-tour={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
              >
                <img
                  className="pixel tab__icon"
                  src={tab === t.id ? TAB_ICONS[t.id].on : TAB_ICONS[t.id].off}
                  alt=""
                  width={24}
                  height={24}
                />
                <span className="tab__label">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </main>
      <MeteorShower />
      <EventOverlays />
      <CatOverlay />
      <Tutorial />
      <OfflineModal />
      <AdModal />
      <Toasts />
      <StartScreen />
    </div>
  )
}
