import { useState } from 'react'
import { artifactDef } from '../game/content/artifacts'
import { CHALLENGES } from '../game/content/challenges'
import { TALENTS, talentLevel } from '../game/content/talents'
import { GALAXY_MIN_DARK_MATTER, GALAXY_MIN_PRESTIGES, canGalaxyReset, shardsGain } from '../game/galaxy'
import { SHIP_UPGRADES } from '../game/content/ship'
import { formatNumber } from '../game/format'
import {
  PRESTIGE_THRESHOLD,
  bonusDarkMatterGain,
  canPrestige,
  coreMultiplier,
  darkMatterGain,
} from '../game/prestige'
import { useGame } from '../store/context'
import { AdButton } from './AdButton'

function GalaxySection() {
  const game = useGame((s) => s.game)
  const galaxyReset = useGame((s) => s.galaxyReset)
  const buyTalent = useGame((s) => s.buyTalent)
  const startChallenge = useGame((s) => s.startChallenge)
  const exitChallenge = useGame((s) => s.exitChallenge)
  const setAutoPrestigeAt = useGame((s) => s.setAutoPrestigeAt)
  const [confirmJump, setConfirmJump] = useState(false)
  const ready = canGalaxyReset(game)
  const gain = shardsGain(game)
  const visible = game.galaxyCount > 0 || game.shards > 0 || game.prestigeCount >= 3
  if (!visible) return null

  return (
    <section className="galaxy">
      <h3>Галактика</h3>
      <p className="muted">
        Осколков звёзд: <b className="shards">{game.shards}</b> · галактик: {game.galaxyCount}
      </p>
      <p className="muted">
        Прыжок сжигает тёмную материю, здания, улучшения и артефакты. Корабль, достижения и таланты остаются. Нужно{' '}
        {GALAXY_MIN_PRESTIGES} перелётов ({game.prestigeCount}/{GALAXY_MIN_PRESTIGES}) и {GALAXY_MIN_DARK_MATTER} ТМ (
        {formatNumber(game.darkMatter)}/{GALAXY_MIN_DARK_MATTER}).
      </p>
      <div className="actions">
        <button
          type="button"
          className={`btn ${confirmJump ? 'btn--danger' : 'btn--primary'}`}
          disabled={!ready}
          onClick={() => {
            if (!confirmJump) {
              setConfirmJump(true)
              return
            }
            setConfirmJump(false)
            galaxyReset()
          }}
        >
          {confirmJump ? 'Точно прыгаем? Всё сгорит!' : `Межгалактический прыжок (+${gain})`}
        </button>
        {confirmJump && (
          <button type="button" className="btn" onClick={() => setConfirmJump(false)}>
            Отмена
          </button>
        )}
      </div>
      {talentLevel(game, 'autoPrestige') > 0 && (
        <label className="auto-prestige">
          Автоперелёт при награде ≥{' '}
          <input
            type="number"
            min={0}
            value={game.autoPrestigeAt}
            onChange={(e) => setAutoPrestigeAt(Number(e.target.value) || 0)}
            aria-label="Порог автоперелёта"
          />{' '}
          ТМ (0 — выключен)
        </label>
      )}
      <h3>Таланты</h3>
      <div className="talents">
        {TALENTS.map((t) => {
          const level = talentLevel(game, t.id)
          const maxed = level >= t.maxLevel
          const cost = t.cost(level)
          return (
            <article className="talent" key={t.id} data-testid={`talent-${t.id}`}>
              <div className="talent__body">
                <b className="talent__name">
                  {t.name}
                  {t.maxLevel > 1 && ` ${level}/${t.maxLevel}`}
                </b>
                <span className="talent__desc">{t.description}</span>
              </div>
              {maxed ? (
                <span className="talent__maxed">Изучено</span>
              ) : (
                <button
                  type="button"
                  className={`btn ${game.shards >= cost ? 'btn--ready' : ''}`}
                  disabled={game.shards < cost}
                  onClick={() => buyTalent(t.id)}
                >
                  {cost} оск.
                </button>
              )}
            </article>
          )
        })}
      </div>
      <h3>Испытания</h3>
      <p className="muted">Спец-забег с ограничением: доберись до перелёта — получишь осколки (один раз за испытание).</p>
      <div className="challenges">
        {CHALLENGES.map((c) => {
          const done = game.challengesDone.includes(c.id)
          const active = game.challenge?.id === c.id
          return (
            <article className={`challenge ${done ? 'challenge--done' : ''}`} key={c.id}>
              <div className="challenge__body">
                <b>
                  {c.name} {done && '✓'}
                </b>
                <span className="challenge__desc">{c.description}</span>
              </div>
              {active ? (
                <button type="button" className="btn btn--danger" onClick={exitChallenge}>
                  Выйти
                </button>
              ) : (
                <button type="button" className="btn" disabled={game.challenge !== null} onClick={() => startChallenge(c.id)}>
                  {done ? 'Ещё раз' : `Начать (+${c.reward})`}
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function PrestigePanel() {
  const runChips = useGame((s) => s.game.stats.runChips)
  const runCores = useGame((s) => s.game.stats.runCores)
  const darkMatter = useGame((s) => s.game.darkMatter)
  const prestigeCount = useGame((s) => s.game.prestigeCount)
  const artifact = useGame((s) => s.game.artifact)
  const shipUpgrades = useGame((s) => s.game.shipUpgrades)
  const ready = useGame((s) => canPrestige(s.game))
  const gain = useGame((s) => darkMatterGain(s.game))
  const bonusGain = useGame((s) => bonusDarkMatterGain(s.game))
  const coresMult = useGame((s) => coreMultiplier(s.game))
  const prestige = useGame((s) => s.prestige)
  const buyShip = useGame((s) => s.buyShip)
  const progress = Math.min(1, runChips / PRESTIGE_THRESHOLD)

  return (
    <div className="panel-body">
      <p>
        Перелёт сбрасывает ресурсы, здания и улучшения, но даёт <b>тёмную материю</b>: +10 % ко всему за единицу.
        После 100 ТМ отдача растёт медленнее — излишки выгоднее сжигать в Галактике.
      </p>
      <p className="muted">
        Перелётов: {prestigeCount} · Тёмной материи: {formatNumber(darkMatter)}
      </p>
      {artifact && (
        <div className="artifact" data-testid="artifact">
          <span className="artifact__label">Артефакт забега:</span>
          <b>{artifactDef(artifact).name}</b>
          <span className="muted"> — {artifactDef(artifact).description}</span>
          <AdButton placement="artifactReroll" label="Сменить артефакт" className="artifact__reroll" />
        </div>
      )}
      <div className="progress" role="progressbar" aria-valuenow={Math.floor(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress__fill" style={{ width: `${progress * 100}%` }} />
        <span className="progress__label">
          {formatNumber(runChips)} / {formatNumber(PRESTIGE_THRESHOLD)} чипов
        </span>
      </div>
      <p>
        Награда: <b className="dm">{gain}</b> тёмной материи
        {ready ? '' : ` — нужно ещё ${formatNumber(PRESTIGE_THRESHOLD - runChips)} чипов`}
      </p>
      <p className="muted">
        ИИ-ядра усиливают награду: {formatNumber(runCores)} ядер за этот забег дают множитель ×{coresMult.toFixed(2)}.
        Первые 50 ядер удваивают награду, дальше рост замедляется.
      </p>
      <div className="actions">
        <button type="button" className="btn btn--primary" disabled={!ready} onClick={prestige}>
          Перелёт (+{gain})
        </button>
        <AdButton placement="prestigeBonus" label={`Перелёт с бонусом (+${bonusGain})`} disabled={!ready} />
      </div>
      <section className="ship">
        <h3>Корабль</h3>
        <p className="muted">
          Улучшения за тёмную материю — навсегда. Внимание: трата ТМ уменьшает пассивный бонус (−10 % за единицу).
        </p>
        {SHIP_UPGRADES.map((u) => {
          const bought = shipUpgrades.includes(u.id)
          const locked = u.requires !== undefined && !shipUpgrades.includes(u.requires)
          const affordable = darkMatter >= u.cost && !locked
          return (
            <article className={`upgrade ${bought ? 'upgrade--bought' : ''}`} key={u.id} data-testid={`ship-${u.id}`}>
              <div className="upgrade__body">
                <h3 className="upgrade__name">{u.name}</h3>
                <p className="upgrade__effect">{u.description}</p>
                {locked && <p className="upgrade__req">Нужен: {SHIP_UPGRADES.find((x) => x.id === u.requires)!.name}</p>}
              </div>
              {bought ? (
                <span className="ship__bought">Куплено</span>
              ) : (
                <button type="button" className="btn btn--buy" disabled={!affordable} onClick={() => buyShip(u.id)}>
                  <span className="btn__label">Купить</span>
                  <span className="btn__cost">
                    <span className="cost cost--dm">{u.cost} ТМ</span>
                  </span>
                </button>
              )}
            </article>
          )
        })}
      </section>
      <GalaxySection />
    </div>
  )
}
