import { ACHIEVEMENTS } from '../game/content/achievements'
import { useGame } from '../store/context'

export function AchievementList() {
  const earned = useGame((s) => s.game.achievements)
  return (
    <div className="panel-body">
      <p className="muted">
        Получено {earned.length} из {ACHIEVEMENTS.length}
      </p>
      <div className="badges">
        {ACHIEVEMENTS.map((a) => {
          const has = earned.includes(a.id)
          return (
            <div className={`badge ${has ? 'badge--earned' : ''}`} key={a.id} title={a.description}>
              <span className="badge__icon" aria-hidden="true">
                {has ? '★' : '☆'}
              </span>
              <span className="badge__name">{a.name}</span>
              <span className="badge__desc">{a.description}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
