import { formatNumber } from '../game/format'
import { PRESTIGE_THRESHOLD, bonusDarkMatterGain, canPrestige, darkMatterGain } from '../game/prestige'
import { useGame } from '../store/context'
import { AdButton } from './AdButton'

export function PrestigePanel() {
  const runChips = useGame((s) => s.game.stats.runChips)
  const darkMatter = useGame((s) => s.game.darkMatter)
  const prestigeCount = useGame((s) => s.game.prestigeCount)
  const ready = useGame((s) => canPrestige(s.game))
  const gain = useGame((s) => darkMatterGain(s.game))
  const bonusGain = useGame((s) => bonusDarkMatterGain(s.game))
  const prestige = useGame((s) => s.prestige)
  const progress = Math.min(1, runChips / PRESTIGE_THRESHOLD)

  return (
    <div className="panel-body">
      <p>
        Перелёт к новому астероиду сбрасывает ресурсы, здания и улучшения, но даёт <b>тёмную материю</b>: +10 % к добыче,
        переработке и клику за каждую единицу — навсегда.
      </p>
      <p className="muted">
        Перелётов: {prestigeCount} · Тёмной материи: {formatNumber(darkMatter)}
      </p>
      <div className="progress" role="progressbar" aria-valuenow={Math.floor(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress__fill" style={{ width: `${progress * 100}%` }} />
        <span className="progress__label">
          {formatNumber(runChips)} / {formatNumber(PRESTIGE_THRESHOLD)} чипов
        </span>
      </div>
      <p>
        Награда сейчас: <b className="dm">{gain}</b> тёмной материи
        {ready ? '' : ` — нужно ещё ${formatNumber(PRESTIGE_THRESHOLD - runChips)} чипов`}
      </p>
      <div className="actions">
        <button type="button" className="btn btn--primary" disabled={!ready} onClick={prestige}>
          Перелёт (+{gain})
        </button>
        <AdButton placement="prestigeBonus" label={`Перелёт с бонусом (+${bonusGain})`} disabled={!ready} hint="Тёмной материи ×1,5" />
      </div>
    </div>
  )
}
