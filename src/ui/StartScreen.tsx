import { asteroidSprite } from '../assets/sprites'
import { useGame } from '../store/context'

export function StartScreen() {
  const started = useGame((s) => s.started)
  const start = useGame((s) => s.start)
  const prestigeCount = useGame((s) => s.game.prestigeCount)
  if (started) return null

  return (
    <div className="start" role="dialog" aria-modal="true" aria-labelledby="start-title">
      <div className="start__card">
        <img className="pixel start__asteroid" src={asteroidSprite(prestigeCount)} alt="" width={128} height={128} />
        <h1 id="start-title" className="start__title">
          Для Максона
        </h1>
        <p className="start__subtitle">от Data Name ID</p>
        <button type="button" className="btn btn--primary start__play" onClick={start} autoFocus>
          Играть
        </button>
        <p className="start__game">Астероид-7 · пиксельный кликер</p>
      </div>
    </div>
  )
}
