import { resourceSprite } from '../assets/sprites'
import { RESOURCE_IDS, resourceName } from '../game/content/resources'
import { netRates } from '../game/economy'
import { formatNumber, formatRate } from '../game/format'
import { useGame } from '../store/context'

export function ResourceBar() {
  const game = useGame((s) => s.game)
  const rates = netRates(game)
  const { resources, darkMatter } = game
  return (
    <header className="resource-bar frame" aria-label="Ресурсы">
      {RESOURCE_IDS.map((id) => (
        <div className={`resource resource--${id}`} key={id} title={resourceName(id)} data-tour={`resource-${id}`}>
          <img className="pixel" src={resourceSprite(id)} alt="" width={16} height={16} />
          <div className="resource__body">
            <span className="resource__amount" data-testid={`amount-${id}`}>
              {formatNumber(resources[id])}
            </span>
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
          <span className="resource__rate">+{darkMatter * 10} % ко всему</span>
        </div>
      </div>
    </header>
  )
}
