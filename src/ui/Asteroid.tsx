import { useCallback, useRef, useState, type MouseEvent } from 'react'
import { asteroidSprite, CRACKS, SPRITES } from '../assets/sprites'
import { CHARGE_MAX, clickValue, comboActive } from '../game/economy'
import { formatNumber } from '../game/format'
import { useGame, useGameApi } from '../store/context'
import { AdButton } from './AdButton'
import { ExpeditionsPanel } from './ExpeditionsPanel'

interface Burst {
  id: number
  x: number
  y: number
  value: number
  crit: boolean
  wow: boolean
  shards: { dx: number; dy: number }[]
}

const BURST_LIFETIME_MS = 700
const BUBBLE_LIFETIME_MS = 2500
const BUBBLE_EVERY_CLICKS = 200

const PHRASES = [
  'Ай!',
  'Щекотно.',
  'Опять ты…',
  'Больно же!',
  'Руда сама себя не добудет.',
  'Ты вообще спишь?',
  'Копай глубже.',
  'Мяу. Ой, не тот персонаж.',
]

export function Asteroid() {
  const prestigeCount = useGame((s) => s.game.prestigeCount)
  const skin = useGame((s) => s.game.asteroidSkin)
  const click = useGame((s) => s.click)
  const value = useGame((s) => clickValue(s.game))
  const boostRemaining = useGame((s) => s.game.effects.boostRemaining)
  const meteorRemaining = useGame((s) => s.game.effects.meteorRemaining)
  const now = useGame((s) => s.now)
  const eventActive = useGame((s) => s.game.effects.event !== null)
  const discoUntil = useGame((s) => s.discoUntil)
  const combo = useGame((s) => comboActive(s.game, s.now))
  const buildings = useGame((s) => s.game.buildings)
  const runClicks = useGame((s) => s.game.stats.runClicks)
  const charge = useGame((s) => s.game.charge)
  const discharge = useGame((s) => s.discharge)
  const api = useGameApi()
  const [bursts, setBursts] = useState<Burst[]>([])
  const [bubble, setBubble] = useState<string | null>(null)
  const [hit, setHit] = useState(0)
  const seq = useRef(0)
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const beat = boostRemaining > 0 && now % 2000 < 400
  const disco = discoUntil > now
  const orbitDrones = Math.min(5, Math.floor(buildings.drone / 10))
  const crackStage = runClicks >= 5000 ? 3 : runClicks >= 2000 ? 2 : runClicks >= 500 ? 1 : 0

  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const rhythmHit = boostRemaining > 0 && Date.now() % 2000 < 400
      const result = click(rhythmHit)
      const rect = event.currentTarget.getBoundingClientRect()
      seq.current += 1
      const id = seq.current
      const count = 3 + Math.floor(Math.random() * 4)
      const burst: Burst = {
        id,
        x: event.clientX - rect.left || rect.width / 2,
        y: event.clientY - rect.top || rect.height / 2,
        value: result.gain,
        crit: result.crit,
        wow: Math.random() < 0.01,
        shards: Array.from({ length: count }, (_, i) => {
          const angle = (Math.PI * 2 * i) / count + Math.random()
          const dist = 30 + Math.random() * 30
          return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist }
        }),
      }
      setBursts((list) => [...list, burst])
      setHit((n) => n + 1)
      setTimeout(() => setBursts((list) => list.filter((b) => b.id !== id)), BURST_LIFETIME_MS)
      const clicks = api.getState().game.stats.clicks
      if (clicks > 0 && clicks % BUBBLE_EVERY_CLICKS === 0) {
        setBubble(PHRASES[(clicks / BUBBLE_EVERY_CLICKS) % PHRASES.length])
        if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
        bubbleTimer.current = setTimeout(() => setBubble(null), BUBBLE_LIFETIME_MS)
      }
    },
    [click, boostRemaining, api],
  )

  return (
    <section className="asteroid-panel frame">
      <div className="asteroid-stage">
        <button
          type="button"
          className={`asteroid ${meteorRemaining > 0 ? 'asteroid--meteor' : ''} ${beat ? 'asteroid--beat' : ''} ${disco ? 'asteroid--disco' : ''}`}
          onClick={onClick}
          aria-label="Добыть руду"
          data-tour="asteroid"
        >
          <img key={hit} className="pixel asteroid__sprite asteroid__sprite--hit" src={asteroidSprite(skin ?? prestigeCount)} alt="" width={160} height={160} />
          {crackStage > 0 && (
            <img className="pixel asteroid__cracks" src={CRACKS[crackStage - 1]} alt="" width={160} height={160} />
          )}
        </button>
        {buildings.laser > 0 && <div className="decor-ring" aria-hidden="true" />}
        {buildings.neurolab > 0 && <div className="decor-glow" aria-hidden="true" />}
        {Array.from({ length: orbitDrones }, (_, i) => (
          <img
            key={i}
            className="pixel decor-drone"
            src={SPRITES['building-drone']}
            alt=""
            width={24}
            height={24}
            style={{ animationDelay: `${(-i * 12) / orbitDrones}s` }}
          />
        ))}
        {buildings.excavator >= 10 && (
          <img className="pixel decor-derrick" src={SPRITES['building-excavator']} alt="" width={40} height={40} />
        )}
        {bubble && (
          <div className="bubble" role="status">
            {bubble}
          </div>
        )}
        {bursts.map((b) => (
          <div className="burst" key={b.id} style={{ left: b.x, top: b.y }} aria-hidden="true">
            <span className={`burst__value ${b.crit ? 'burst__value--crit' : ''}`}>
              +{formatNumber(b.value)}
              {b.crit ? ' КРИТ!' : b.wow ? ' (ого!)' : ''}
            </span>
            {b.shards.map((s, i) => (
              <img
                key={i}
                className="pixel burst__shard"
                src={SPRITES.shard}
                alt=""
                width={16}
                height={16}
                style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px` } as React.CSSProperties}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="asteroid__hint">
        Клик: +{formatNumber(value)} руды
        {boostRemaining > 0 && <span className={`asteroid__beat ${beat ? 'asteroid__beat--on' : ''}`}> ♪ в такт ×2</span>}
      </p>
      <div className={`combo-bar ${combo > 1 ? '' : 'combo-bar--idle'}`} aria-label="Комбо">
        <div className="combo-bar__fill" style={{ width: `${Math.min(100, Math.max(0, combo - 1))}%` }} />
        <span className="combo-bar__label">{combo > 1 ? `Комбо ${combo}` : 'Комбо'}</span>
      </div>
      <div className="charge" aria-label="Заряд реактора" data-tour="charge">
        <div className="charge__bar">
          <div className="charge__fill" style={{ width: `${charge}%` }} />
          <span className="charge__label">Заряд {charge} %</span>
        </div>
        <button type="button" className="btn btn--discharge" disabled={charge < CHARGE_MAX} onClick={discharge}>
          РАЗРЯД
        </button>
      </div>
      <div className="asteroid-actions" data-tour="ad-buttons">
        <AdButton
          placement="boost"
          label="Перегрузка реактора"
          activeLabel="Перегрузка"
          activeRemaining={boostRemaining}
        />
        <AdButton
          placement="meteorShower"
          label="Метеоритный дождь"
          activeLabel="Дождь"
          activeRemaining={meteorRemaining}
        />
        <AdButton placement="eventRush" label="Вызвать событие" disabled={eventActive} className="asteroid-actions__wide" />
      </div>
      <ExpeditionsPanel />
    </section>
  )
}
