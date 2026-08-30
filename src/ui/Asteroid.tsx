import { useCallback, useRef, useState, type MouseEvent } from 'react'
import { asteroidSprite, SPRITES } from '../assets/sprites'
import { clickValue } from '../game/economy'
import { formatNumber } from '../game/format'
import { useGame } from '../store/context'
import { AdButton } from './AdButton'

interface Burst {
  id: number
  x: number
  y: number
  value: number
  shards: { dx: number; dy: number }[]
}

const BURST_LIFETIME_MS = 700

export function Asteroid() {
  const prestigeCount = useGame((s) => s.game.prestigeCount)
  const click = useGame((s) => s.click)
  const value = useGame((s) => clickValue(s.game))
  const boostRemaining = useGame((s) => s.game.effects.boostRemaining)
  const meteorRemaining = useGame((s) => s.game.effects.meteorRemaining)
  const now = useGame((s) => s.now)
  const discoUntil = useGame((s) => s.discoUntil)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [hit, setHit] = useState(0)
  const seq = useRef(0)

  const beat = boostRemaining > 0 && now % 2000 < 400
  const disco = discoUntil > now

  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const rhythmHit = boostRemaining > 0 && Date.now() % 2000 < 400
      click(rhythmHit)
      const rect = event.currentTarget.getBoundingClientRect()
      seq.current += 1
      const id = seq.current
      const count = 3 + Math.floor(Math.random() * 4)
      const burst: Burst = {
        id,
        x: event.clientX - rect.left || rect.width / 2,
        y: event.clientY - rect.top || rect.height / 2,
        value: value * (Math.random() < 0.01 ? -1 : 1),
        shards: Array.from({ length: count }, (_, i) => {
          const angle = (Math.PI * 2 * i) / count + Math.random()
          const dist = 30 + Math.random() * 30
          return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist }
        }),
      }
      setBursts((list) => [...list, burst])
      setHit((n) => n + 1)
      setTimeout(() => setBursts((list) => list.filter((b) => b.id !== id)), BURST_LIFETIME_MS)
    },
    [click, value, boostRemaining],
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
          <img key={hit} className="pixel asteroid__sprite asteroid__sprite--hit" src={asteroidSprite(prestigeCount)} alt="" width={160} height={160} />
        </button>
        {bursts.map((b) => (
          <div className="burst" key={b.id} style={{ left: b.x, top: b.y }} aria-hidden="true">
            <span className="burst__value">
              +{formatNumber(Math.abs(b.value))}
              {b.value < 0 ? ' (ого!)' : ''}
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
      </div>
    </section>
  )
}
