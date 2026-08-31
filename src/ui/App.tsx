import { useEffect, useState } from 'react'
import { TAB_ICONS } from '../assets/sprites'
import { availableUpgrades } from '../game/content/upgrades'
import { canAfford } from '../game/economy'
import { canPrestige } from '../game/prestige'
import { skillPoints } from '../game/skills'
import { useGame } from '../store/context'
import type { TabId } from '../store/gameStore'
import { AchievementList } from './AchievementList'
import { AdModal } from './AdModal'
import { Asteroid } from './Asteroid'
import { BuffBar } from './BuffBar'
import { BuildingList } from './BuildingList'
import { CatOverlay } from './CatOverlay'
import { EventOverlays } from './EventOverlays'
import { MeteorShower } from './MeteorShower'
import { OfflineModal } from './OfflineModal'
import { PrestigePanel } from './PrestigePanel'
import { QuestPanel } from './QuestPanel'
import { ResourceBar } from './ResourceBar'
import { SettingsPanel } from './SettingsPanel'
import { SkillsPanel } from './SkillsPanel'
import { StartScreen } from './StartScreen'
import { Toasts } from './Toast'
import { Tutorial } from './Tutorial'
import { UpgradeList } from './UpgradeList'

const TABS: { id: TabId; label: string }[] = [
  { id: 'buildings', label: 'Здания' },
  { id: 'upgrades', label: 'Улучшения' },
  { id: 'skills', label: 'Навыки' },
  { id: 'achievements', label: 'Достижения' },
  { id: 'prestige', label: 'Перелёт' },
  { id: 'settings', label: 'Настройки' },
]

const PANELS: Record<TabId, () => React.JSX.Element> = {
  buildings: BuildingList,
  upgrades: UpgradeList,
  skills: SkillsPanel,
  achievements: AchievementList,
  prestige: PrestigePanel,
  settings: SettingsPanel,
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export function App() {
  const tab = useGame((s) => s.tab)
  const setTab = useGame((s) => s.setTab)
  const triggerDisco = useGame((s) => s.triggerDisco)
  const theme = useGame((s) => s.game.theme)
  const upgradesReady = useGame((s) =>
    availableUpgrades(s.game).filter((u) => canAfford(s.game.resources, u.cost)).length,
  )
  const prestigeReady = useGame((s) => canPrestige(s.game))
  const freePoints = useGame((s) => skillPoints(s.game))
  const shakeSeq = useGame((s) => s.shakeSeq)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (shakeSeq === 0) return
    setShaking(true)
    const timer = setTimeout(() => setShaking(false), 500)
    return () => clearTimeout(timer)
  }, [shakeSeq])

  useEffect(() => {
    let position = 0
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      const tabIndex = ['1', '2', '3', '4', '5', '6'].indexOf(event.key)
      if (tabIndex >= 0) setTab(TABS[tabIndex].id)
      position = key === KONAMI[position] ? position + 1 : key === KONAMI[0] ? 1 : 0
      if (position === KONAMI.length) {
        position = 0
        triggerDisco()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [triggerDisco, setTab])
  const Panel = PANELS[tab]

  return (
    <div className={`app ${shaking ? 'app--shake' : ''}`}>
      <ResourceBar />
      <BuffBar />
      <QuestPanel />
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
                {t.id === 'upgrades' && upgradesReady > 0 && <span className="tab__badge">{upgradesReady}</span>}
                {t.id === 'prestige' && prestigeReady && <span className="tab__badge tab__badge--ready">!</span>}
                {t.id === 'skills' && freePoints > 0 && <span className="tab__badge tab__badge--skill">{freePoints}</span>}
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
