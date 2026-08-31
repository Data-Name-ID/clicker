import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { SKILLS, SKILL_TREES, skillDef, skillsInTree } from '../game/content/skills'
import type { SkillDef } from '../game/content/skills'
import { canLearnSkill, levelProgress, skillPoints } from '../game/skills'
import type { SkillId } from '../game/types'
import { useGame } from '../store/context'
import { SKILL_LAYOUT } from './skillLayout'
import { tipStyle } from './tipStyle'

type NodeStatus = 'learned' | 'ready' | 'locked'

function ancestorsOf(id: SkillId): Set<SkillId> {
  const result = new Set<SkillId>()
  const walk = (skill: SkillId) => {
    for (const req of skillDef(skill).requires) {
      if (!result.has(req)) {
        result.add(req)
        walk(req)
      }
    }
  }
  walk(id)
  return result
}

interface Selection {
  id: SkillId
  el: HTMLElement
}

function usePopoverStyle(selection: Selection | null): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({})
  useEffect(() => {
    if (!selection) return
    const update = () => setStyle(tipStyle(selection.el))
    update()
    const timer = setInterval(update, 200)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [selection])
  return style
}

function Constellation({
  treeId,
  selected,
  justLearned,
  onSelect,
}: {
  treeId: (typeof SKILL_TREES)[number]['id']
  selected: SkillId | null
  justLearned: SkillId | null
  onSelect: (id: SkillId, el: HTMLElement) => void
}) {
  const game = useGame((s) => s.game)
  const [hovered, setHovered] = useState<SkillId | null>(null)
  const tree = SKILL_TREES.find((t) => t.id === treeId)!
  const nodes = skillsInTree(treeId)
  const learnedCount = nodes.filter((n) => game.skills.includes(n.id)).length
  const complete = learnedCount === nodes.length
  const focus = hovered ?? (selected && nodes.some((n) => n.id === selected) ? selected : null)
  const path = focus ? ancestorsOf(focus) : null
  const hoveredDef = hovered ? skillDef(hovered) : null

  const status = (def: SkillDef): NodeStatus =>
    game.skills.includes(def.id) ? 'learned' : canLearnSkill(game, def.id) ? 'ready' : 'locked'

  return (
    <section className={`constellation constellation--${treeId} ${complete ? 'constellation--complete' : ''}`}>
      <h3 className="constellation__title">
        {tree.name}
        <span className="constellation__count">
          {complete ? '✦ собрано' : `${learnedCount}/${nodes.length}`}
        </span>
      </h3>
      <div className="sky">
        <span className="sky__comet" aria-hidden="true" />
        <svg className="sky__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {nodes.flatMap((def) =>
            def.requires.map((req) => {
              const from = SKILL_LAYOUT[req]
              const to = SKILL_LAYOUT[def.id]
              const lit = game.skills.includes(req) && game.skills.includes(def.id)
              const half = game.skills.includes(req)
              const onPath = path !== null && (path.has(def.id) || focus === def.id) && (path.has(req) || focus === req)
              return (
                <line
                  key={`${req}-${def.id}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  vectorEffect="non-scaling-stroke"
                  className={`sky__line ${lit ? 'sky__line--lit' : half ? 'sky__line--half' : ''} ${onPath ? 'sky__line--path' : ''}`}
                />
              )
            }),
          )}
        </svg>
        {nodes.map((def, index) => {
          const st = status(def)
          const pos = SKILL_LAYOUT[def.id]
          const onPath = path !== null && (path.has(def.id) || focus === def.id)
          return (
            <button
              type="button"
              key={def.id}
              className={`star star--${st} ${selected === def.id ? 'star--selected' : ''} ${onPath ? 'star--path' : ''} ${justLearned === def.id ? 'star--burst' : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, '--twinkle-delay': `${(index * 0.7) % 3}s` } as React.CSSProperties}
              onClick={(event) => onSelect(def.id, event.currentTarget)}
              onMouseEnter={() => setHovered(def.id)}
              onMouseLeave={() => setHovered((h) => (h === def.id ? null : h))}
              data-testid={`skill-${def.id}`}
              aria-label={def.name}
            >
              <span className="star__glyph" aria-hidden="true">
                {st === 'learned' ? '★' : st === 'ready' ? '✦' : '·'}
              </span>
              <span className="star__name">{def.name}</span>
            </button>
          )
        })}
        <div className="sky__status" data-testid={`status-${treeId}`}>
          {hoveredDef ? (
            <>
              <b>{hoveredDef.name}</b> — {hoveredDef.description}
            </>
          ) : (
            <span className="sky__status-hint">{complete ? 'Созвездие собрано целиком' : 'Наведи на звезду — расскажу, что даёт'}</span>
          )}
        </div>
      </div>
    </section>
  )
}

export function SkillsPanel() {
  const game = useGame((s) => s.game)
  const learn = useGame((s) => s.learnSkill)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [justLearned, setJustLearned] = useState<SkillId | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverStyle = usePopoverStyle(selection)
  const progress = levelProgress(game.xp)
  const points = skillPoints(game)
  const ratio = Math.min(1, progress.into / progress.need)

  useEffect(() => {
    if (!selection) return
    const close = (event: Event) => {
      const target = event.target as Node
      if (selection.el.contains(target) || popoverRef.current?.contains(target)) return
      setSelection(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelection(null)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [selection])

  const selectedDef = selection ? skillDef(selection.id) : null
  const selectedLearned = selectedDef ? game.skills.includes(selectedDef.id) : false
  const selectedReady = selectedDef ? canLearnSkill(game, selectedDef.id) : false
  const missing = selectedDef ? selectedDef.requires.filter((r) => !game.skills.includes(r)) : []

  return (
    <div className="panel-body">
      <div className="xp-head">
        <b>Уровень {progress.level}</b>
        <span className={`xp-head__points ${points > 0 ? 'xp-head__points--free' : ''}`}>
          Очков навыков: {points}
        </span>
      </div>
      <div className="xp-bar" role="progressbar" aria-valuenow={Math.floor(ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className="xp-bar__fill" style={{ width: `${ratio * 100}%` }} />
        <span className="xp-bar__label">
          {Math.floor(progress.into)} / {Math.ceil(progress.need)} опыта
        </span>
      </div>
      <p className="muted">
        Жми на звезду — рядом откроется описание. Навыки остаются с тобой навсегда, даже после прыжка.
      </p>
      <div className="constellations">
        {SKILL_TREES.map((tree) => (
          <Constellation
            key={tree.id}
            treeId={tree.id}
            selected={selection?.id ?? null}
            justLearned={justLearned}
            onSelect={(id, el) => setSelection((prev) => (prev?.id === id ? null : { id, el }))}
          />
        ))}
      </div>
      <p className="muted">Всего изучено: {game.skills.length} из {SKILLS.length}</p>
      {selectedDef &&
        createPortal(
          <div className="star-popover frame" style={popoverStyle} data-testid="star-info" ref={popoverRef} role="dialog" aria-label={selectedDef.name}>
            <b className="star-info__name">{selectedDef.name}</b>
            <span className="star-info__desc">{selectedDef.description}</span>
            {!selectedLearned && missing.length > 0 && (
              <span className="star-info__req">Нужно: {missing.map((r) => skillDef(r).name).join(', ')}</span>
            )}
            {!selectedLearned && missing.length === 0 && points <= 0 && (
              <span className="star-info__req">Нет свободных очков</span>
            )}
            {selectedLearned ? (
              <span className="star-info__learned">Изучено</span>
            ) : (
              <button
                type="button"
                className={`btn ${selectedReady ? 'btn--ready' : ''}`}
                disabled={!selectedReady}
                onClick={() => {
                  learn(selectedDef.id)
                  setJustLearned(selectedDef.id)
                  setTimeout(() => setJustLearned(null), 900)
                }}
              >
                Изучить
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
