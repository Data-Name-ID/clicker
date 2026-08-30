import { formatNumber } from '../game/format'
import { questProgress } from '../game/quests'
import { useGame } from '../store/context'

export function QuestPanel() {
  const game = useGame((s) => s.game)
  if (game.quest.goal <= 0) return null
  const progress = questProgress(game)
  const ratio = Math.min(1, progress.current / progress.goal)

  return (
    <aside className="quest" aria-label="Задание" data-testid="quest">
      <div className="quest__head">
        <span className="quest__mark" aria-hidden="true">!</span>
        <b className="quest__name">{progress.def.name}</b>
        <span className="quest__reward">{progress.def.rewardText}</span>
      </div>
      <p className="quest__desc">{progress.def.description}</p>
      <div className="quest__bar">
        <div className="quest__fill" style={{ width: `${ratio * 100}%` }} />
        <span className="quest__label">
          {formatNumber(progress.current)} / {formatNumber(progress.goal)}
        </span>
      </div>
    </aside>
  )
}
