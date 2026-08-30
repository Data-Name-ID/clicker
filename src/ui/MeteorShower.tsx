import { useMemo } from 'react'
import { SPRITES } from '../assets/sprites'
import { useGame } from '../store/context'

const METEOR_COUNT = 14

export function MeteorShower() {
  const active = useGame((s) => s.game.effects.meteorRemaining > 0)
  const meteors = useMemo(
    () =>
      Array.from({ length: METEOR_COUNT }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        delay: `${((i * 53) % 20) / 10}s`,
        duration: `${1.4 + ((i * 29) % 10) / 10}s`,
      })),
    [],
  )
  if (!active) return null

  return (
    <div className="meteor-shower" aria-hidden="true">
      {meteors.map((m) => (
        <img
          key={m.id}
          className="pixel meteor"
          src={SPRITES.meteor}
          alt=""
          width={32}
          height={32}
          style={{ left: m.left, animationDelay: m.delay, animationDuration: m.duration }}
        />
      ))}
    </div>
  )
}
