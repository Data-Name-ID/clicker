import { useState } from 'react'
import { SPRITES } from '../assets/sprites'
import { isMeteorShowerActive } from '../game/events'
import { useGame } from '../store/context'

const METEOR_COUNT = 14

interface MeteorSpec {
  id: number
  left: string
  delay: string
  duration: string
}

const METEORS: MeteorSpec[] = Array.from({ length: METEOR_COUNT }, (_, i) => ({
  id: i,
  left: `${(i * 37) % 100}%`,
  delay: `${((i * 53) % 20) / 10}s`,
  duration: `${1.4 + ((i * 29) % 10) / 10}s`,
}))

export function MeteorShower() {
  const active = useGame((s) => isMeteorShowerActive(s.game))
  const clickMeteor = useGame((s) => s.clickMeteor)
  const [popped, setPopped] = useState<Record<number, number>>({})
  if (!active) return null

  const onCatch = (id: number) => {
    clickMeteor()
    setPopped((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }))
  }

  return (
    <div className="meteor-shower" aria-hidden="false">
      {METEORS.map((m) => (
        <button
          type="button"
          key={`${m.id}-${popped[m.id] ?? 0}`}
          className="meteor-btn"
          style={{ left: m.left, animationDelay: m.delay, animationDuration: m.duration }}
          onClick={() => onCatch(m.id)}
          aria-label="Поймать метеор"
          tabIndex={-1}
        >
          <img className="pixel meteor__img" src={SPRITES.meteor} alt="" width={32} height={32} />
        </button>
      ))}
    </div>
  )
}
