import { useEffect, useState } from 'react'
import { isLastTutorialStep, tutorialStep, type TutorialStepId } from '../game/tutorial'
import { useGame } from '../store/context'
import type { TabId } from '../store/gameStore'

interface StepTarget {
  tab: TabId
  selectors: string[]
}

const TARGETS: Record<TutorialStepId, StepTarget> = {
  click: { tab: 'buildings', selectors: ['[data-tour="asteroid"]'] },
  quests: { tab: 'buildings', selectors: ['[data-tour="quest"]', '[data-tour="asteroid"]'] },
  drone: { tab: 'buildings', selectors: ['[data-tour="building-drone"]', '[data-tour="buildings"]'] },
  combo: { tab: 'buildings', selectors: ['[data-tour="charge"]', '[data-tour="asteroid"]'] },
  ads: { tab: 'buildings', selectors: ['[data-tour="ad-buttons"]'] },
  smelter: { tab: 'buildings', selectors: ['[data-tour="building-smelter"]', '[data-tour="resource-ore"]'] },
  ore: { tab: 'buildings', selectors: ['[data-tour="building-smelter"]'] },
  events: { tab: 'buildings', selectors: ['[data-tour="ad-buttons"]', '[data-tour="asteroid"]'] },
  skills: { tab: 'buildings', selectors: ['[data-tour="tab-skills"]'] },
  factory: { tab: 'buildings', selectors: ['[data-tour="building-factory"]', '[data-tour="resource-alloy"]'] },
  cores: { tab: 'buildings', selectors: ['[data-tour="building-neurolab"]', '[data-tour="resource-chip"]'] },
  expeditions: { tab: 'buildings', selectors: ['[data-tour="expeditions"]', '[data-tour="buildings"]'] },
  bonuses: { tab: 'buildings', selectors: ['[data-tour="tab-achievements"]'] },
  prestige: { tab: 'buildings', selectors: ['[data-tour="tab-prestige"]'] },
  shipInfo: { tab: 'buildings', selectors: ['[data-tour="tab-prestige"]'] },
  galaxyInfo: { tab: 'buildings', selectors: ['[data-tour="tab-prestige"]'] },
}

interface Box {
  left: number
  top: number
  width: number
  height: number
}

const PADDING = 6
const MEASURE_INTERVAL_MS = 200
const MESSAGE_HEIGHT = 190

function findTarget(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) return el
  }
  return null
}

function measure(selectors: string[]): Box | null {
  const el = findTarget(selectors)
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return { left: r.left - PADDING, top: r.top - PADDING, width: r.width + PADDING * 2, height: r.height + PADDING * 2 }
}

function useTargetBox(selectors: string[], key: string): Box | null {
  const [box, setBox] = useState<Box | null>(null)
  useEffect(() => {
    const update = () => setBox(measure(selectors))
    update()
    const timer = setInterval(update, MEASURE_INTERVAL_MS)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [key, selectors])
  return box
}

export function Tutorial() {
  const step = useGame((s) => tutorialStep(s.game))
  const progress = useGame((s) => {
    const current = tutorialStep(s.game)
    return current?.progress?.(s.game) ?? ''
  })
  const acked = useGame((s) => s.tourAck)
  const ack = useGame((s) => s.ackTutorial)
  const dismiss = useGame((s) => s.dismissTutorial)
  const see = useGame((s) => s.seeTutorial)
  const setTab = useGame((s) => s.setTab)
  const stepId = step?.id ?? null
  const target = stepId ? TARGETS[stepId] : null
  const modal = step !== null && acked !== step.id
  const box = useTargetBox(target?.selectors ?? [], stepId ?? '')

  useEffect(() => {
    if (target) setTab(target.tab)
  }, [stepId, target, setTab])

  useEffect(() => {
    if (!modal || !target) return
    findTarget(target.selectors)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  }, [modal, stepId, target])

  if (!step) return null
  const last = isLastTutorialStep(step)
  const info = step.kind === 'info'

  if (!modal) {
    return (
      <>
        {box && <div className="tour-outline" style={box} aria-hidden="true" />}
        <div className="tour-hint" data-testid="tour-hint">
          <span className="tour-hint__text">
            {step.hint}
            {progress && <b className="tour-hint__progress"> {progress}</b>}
          </span>
          <button type="button" className="tour-hint__more" onClick={() => ack(null)} aria-label="Показать подсказку">
            ?
          </button>
        </div>
      </>
    )
  }

  const vh = typeof window === 'undefined' ? 0 : window.innerHeight
  const below = box ? box.top + box.height + 12 : 0
  const placeBelow = !box || below + MESSAGE_HEIGHT < vh
  const messageStyle: React.CSSProperties = box
    ? placeBelow
      ? { top: below }
      : { bottom: vh - box.top + 12 }
    : { top: '50%', transform: 'translate(-50%, -50%)' }

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Обучение">
      {box ? (
        <>
          <div className="tour__shade" style={{ left: 0, top: 0, right: 0, height: Math.max(0, box.top) }} />
          <div className="tour__shade" style={{ left: 0, top: box.top + box.height, right: 0, bottom: 0 }} />
          <div className="tour__shade" style={{ left: 0, top: box.top, width: Math.max(0, box.left), height: box.height }} />
          <div className="tour__shade" style={{ left: box.left + box.width, top: box.top, right: 0, height: box.height }} />
          <div className="tour__hole" style={box} aria-hidden="true" />
        </>
      ) : (
        <div className="tour__shade" style={{ inset: 0 }} />
      )}
      <div className="tour__message frame" style={messageStyle}>
        <h2 className="tour__title">{step.title}</h2>
        <p className="tour__text">
          {step.text}
          {progress && <b className="tour__progress"> {progress}</b>}
        </p>
        <div className="actions">
          {last ? (
            <button type="button" className="btn btn--primary" onClick={dismiss}>
              Понятно
            </button>
          ) : (
            <>
              {info ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    see(step.id)
                    ack(step.id)
                  }}
                >
                  Понятно
                </button>
              ) : (
                <button type="button" className="btn btn--primary" onClick={() => ack(step.id)}>
                  Далее
                </button>
              )}
              <button type="button" className="btn" onClick={dismiss}>
                Пропустить обучение
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
