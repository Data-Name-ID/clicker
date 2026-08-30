import { useState } from 'react'
import { ACHIEVEMENTS } from '../game/content/achievements'
import { formatDuration, formatNumber } from '../game/format'
import { useGame } from '../store/context'

function StatsView() {
  const game = useGame((s) => s.game)
  const now = useGame((s) => s.now)
  const rows: [string, string][] = [
    ['Кликов', formatNumber(game.stats.clicks)],
    ['Лучшее комбо', formatNumber(game.stats.comboBest)],
    ['Руды добыто', formatNumber(game.stats.totalProduced.ore)],
    ['Сплава выплавлено', formatNumber(game.stats.totalProduced.alloy)],
    ['Чипов собрано', formatNumber(game.stats.totalProduced.chip)],
    ['Ядер обучено', formatNumber(game.stats.totalProduced.core)],
    ['Перелётов', formatNumber(game.prestigeCount)],
    ['Тёмной материи', formatNumber(game.darkMatter)],
    ['Время забега', game.stats.runStartedAt > 0 ? formatDuration(Math.max(0, now - game.stats.runStartedAt)) : '—'],
    ['Событий пережито', formatNumber(game.stats.eventsSeen)],
    ['Метеоров поймано', formatNumber(game.stats.meteorsCaught)],
    ['Заданий выполнено', formatNumber(game.stats.questsCompleted)],
    ['Разрядов реактора', formatNumber(game.stats.discharges)],
    ['Котов поймано', formatNumber(game.stats.catsCaught)],
    ['Рекламы просмотрено', formatNumber(game.stats.adsWatched)],
  ]
  return (
    <dl className="stats">
      {rows.map(([label, value]) => (
        <div className="stats__row" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function AchievementList() {
  const earned = useGame((s) => s.game.achievements)
  const [view, setView] = useState<'badges' | 'stats'>('badges')

  return (
    <div className="panel-body">
      <div className="segmented" role="group" aria-label="Раздел">
        <button
          type="button"
          className={`btn btn--seg ${view === 'badges' ? 'btn--on' : ''}`}
          onClick={() => setView('badges')}
          aria-pressed={view === 'badges'}
        >
          Достижения
        </button>
        <button
          type="button"
          className={`btn btn--seg ${view === 'stats' ? 'btn--on' : ''}`}
          onClick={() => setView('stats')}
          aria-pressed={view === 'stats'}
        >
          Статистика
        </button>
      </div>
      {view === 'stats' ? (
        <StatsView />
      ) : (
        <>
          <p className="muted">
            Получено {earned.length} из {ACHIEVEMENTS.length}
          </p>
          <div className="badges">
            {ACHIEVEMENTS.map((a) => {
              const has = earned.includes(a.id)
              const hidden = a.secret && !has
              return (
                <div className={`badge ${has ? 'badge--earned' : ''}`} key={a.id} title={hidden ? 'Секретное достижение' : a.description}>
                  <span className="badge__icon" aria-hidden="true">
                    {has ? '★' : hidden ? '?' : '☆'}
                  </span>
                  <span className="badge__name">{hidden ? '???' : a.name}</span>
                  <span className="badge__desc">{hidden ? 'Секрет' : a.description}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
