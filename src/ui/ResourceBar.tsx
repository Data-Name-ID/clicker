import { useEffect, useRef, useState } from 'react'
import { resourceSprite } from '../assets/sprites'
import { RESOURCE_IDS, resourceName } from '../game/content/resources'
import { darkMatterMultiplier, netRates } from '../game/economy'
import { formatNumber, formatRate } from '../game/format'
import { useGame } from '../store/context'

const TWEEN_MS = import.meta.env.MODE === 'test' ? 0 : 250

function useTweened(value: number): number {
  const [display, setDisplay] = useState(value)
  const current = useRef(value)
  useEffect(() => {
    if (TWEEN_MS === 0) {
      current.current = value
      setDisplay(value)
      return
    }
    const from = current.current
    const diff = value - from
    if (diff === 0) return
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / TWEEN_MS)
      current.current = from + diff * k
      setDisplay(current.current)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return display
}

function Amount({ id, value }: { id: string; value: number }) {
  const display = useTweened(value)
  return (
    <span className="resource__amount" data-testid={`amount-${id}`}>
      {formatNumber(display)}
    </span>
  )
}

export function ResourceBar() {
  const game = useGame((s) => s.game)
  const rates = netRates(game)
  const { resources, darkMatter } = game
  const coreVisible = resources.core > 0 || game.buildings.neurolab > 0 || game.stats.peakResources.chip >= 1000
  const visible = RESOURCE_IDS.filter((id) => id !== 'core' || coreVisible)
  return (
    <header className="resource-bar frame" aria-label="Ресурсы">
      {visible.map((id) => (
        <div className={`resource resource--${id}`} key={id} title={resourceName(id)} data-tour={`resource-${id}`}>
          <img className="pixel" src={resourceSprite(id)} alt="" width={16} height={16} />
          <div className="resource__body">
            <Amount id={id} value={resources[id]} />
            <span className="resource__rate">
              {rates[id] >= 0 ? '+' : ''}
              {formatRate(rates[id])}/с
            </span>
          </div>
        </div>
      ))}
      <div className="resource resource--darkMatter" title={resourceName('darkMatter')}>
        <img className="pixel" src={resourceSprite('darkMatter')} alt="" width={16} height={16} />
        <div className="resource__body">
          <span className="resource__amount" data-testid="amount-darkMatter">
            {formatNumber(darkMatter)}
          </span>
          <span className="resource__rate">+{formatNumber(Math.round((darkMatterMultiplier(game) - 1) * 100))} % ко всему</span>
        </div>
      </div>
    </header>
  )
}
