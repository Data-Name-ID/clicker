import { resourceSprite } from '../assets/sprites'
import { RESOURCE_IDS, resourceName } from '../game/content/resources'
import { formatDuration, formatNumber } from '../game/format'
import { useGame } from '../store/context'
import { AdButton } from './AdButton'

export function OfflineModal() {
  const offline = useGame((s) => s.offline)
  const close = useGame((s) => s.closeOffline)
  if (!offline) return null

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="offline-title">
      <div className="modal frame">
        <h2 id="offline-title">Пока вас не было</h2>
        <p className="muted">Тебя не было {formatDuration(offline.elapsed * 1000)} — база работала сама</p>
        <ul className="gains">
          {RESOURCE_IDS.map((id) => (
            <li key={id} className={`gain gain--${id}`}>
              <img className="pixel" src={resourceSprite(id)} alt="" width={16} height={16} />
              {resourceName(id)}: <b>+{formatNumber(offline.gains[id])}</b>
            </li>
          ))}
        </ul>
        <div className="actions">
          <button type="button" className="btn" onClick={close}>
            Забрать
          </button>
          <AdButton placement="offlineDouble" label="Забрать ×2" />
        </div>
      </div>
    </div>
  )
}
