import { useState } from 'react'
import { EXPEDITION_KINDS, EXPEDITION_PARTY_SIZES, expeditionKindDef } from '../game/content/expeditions'
import { busyDrones, canStartExpedition, isExpeditionReady, maxExpeditionSlots } from '../game/expeditions'
import { formatDuration } from '../game/format'
import type { ExpeditionKind } from '../game/types'
import { useGame } from '../store/context'

export function ExpeditionsPanel() {
  const game = useGame((s) => s.game)
  const now = useGame((s) => s.now)
  const start = useGame((s) => s.startExpedition)
  const collect = useGame((s) => s.collectExpedition)
  const [kind, setKind] = useState<ExpeditionKind>('short')
  const [party, setParty] = useState(10)
  if (game.buildings.drone < 10 && game.expeditions.length === 0) return null

  const slots = maxExpeditionSlots(game)
  const free = game.buildings.drone - busyDrones(game)

  return (
    <details className="expeditions">
      <summary>
        Экспедиции ({game.expeditions.length}/{slots})
        {game.expeditions.some((e) => isExpeditionReady(e, now)) && <span className="expeditions__ready"> — есть что забрать!</span>}
      </summary>
      {game.expeditions.map((e, i) => {
        const def = expeditionKindDef(e.kind)
        const ready = isExpeditionReady(e, now)
        return (
          <div className="expedition" key={`${e.endsAt}-${i}`}>
            <span className="expedition__info">
              {def.name} · {e.drones} дронов
            </span>
            {ready ? (
              <button type="button" className="btn btn--primary" onClick={() => collect(i)}>
                Забрать
              </button>
            ) : (
              <span className="expedition__timer">{formatDuration(e.endsAt - now)}</span>
            )}
          </div>
        )
      })}
      {game.expeditions.length < slots && (
        <div className="expedition-form">
          <div className="segmented" role="group" aria-label="Тип экспедиции">
            {EXPEDITION_KINDS.map((k) => (
              <button
                type="button"
                key={k.kind}
                className={`btn btn--seg ${kind === k.kind ? 'btn--on' : ''}`}
                onClick={() => setKind(k.kind)}
                aria-pressed={kind === k.kind}
              >
                {k.name} ({formatDuration(k.durationSec * 1000)})
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Сколько дронов">
            {EXPEDITION_PARTY_SIZES.map((n) => (
              <button
                type="button"
                key={n}
                className={`btn btn--seg ${party === n ? 'btn--on' : ''}`}
                onClick={() => setParty(n)}
                aria-pressed={party === n}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            disabled={!canStartExpedition(game, kind, party)}
            onClick={() => start(kind, party)}
          >
            Отправить (свободно: {free})
          </button>
          <p className="muted expedition-form__hint">
            15 % шанс провала — вернётся лишь половина отряда. Пока дроны в пути, они не добывают.
          </p>
        </div>
      )}
    </details>
  )
}
