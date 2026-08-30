import { useState } from 'react'
import { ASTEROIDS } from '../assets/sprites'
import type { ThemeId } from '../game/types'
import { SaveError } from '../game/save'
import { useGame } from '../store/context'

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'classic', label: 'Классика' },
  { id: 'void', label: 'Пустота' },
  { id: 'nebula', label: 'Туманность' },
  { id: 'terminal', label: 'Терминал' },
]

export function SettingsPanel() {
  const exportSave = useGame((s) => s.exportSave)
  const importSave = useGame((s) => s.importSave)
  const reset = useGame((s) => s.reset)
  const save = useGame((s) => s.save)
  const notify = useGame((s) => s.notify)
  const theme = useGame((s) => s.game.theme)
  const setTheme = useGame((s) => s.setTheme)
  const asteroidSkin = useGame((s) => s.game.asteroidSkin)
  const setAsteroidSkin = useGame((s) => s.setAsteroidSkin)
  const prestigeCount = useGame((s) => s.game.prestigeCount)
  const unlockedSkins = Math.min(prestigeCount + 1, ASTEROIDS.length)
  const [exported, setExported] = useState('')
  const [importText, setImportText] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const onExport = () => setExported(exportSave())

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(exported)
      notify('info', 'Скопировано')
    } catch {
      notify('error', 'Не удалось скопировать — выделите текст вручную')
    }
  }

  const onImport = () => {
    try {
      importSave(importText)
      setImportText('')
    } catch (error) {
      notify('error', 'Не удалось импортировать', error instanceof SaveError ? error.message : undefined)
    }
  }

  const onReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    reset()
    setConfirmReset(false)
    notify('info', 'Игра сброшена')
  }

  return (
    <div className="panel-body settings">
      <section>
        <h3>Оформление</h3>
        <p className="muted">Тема интерфейса:</p>
        <div className="actions">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`btn btn--seg ${theme === t.id ? 'btn--on' : ''}`}
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="muted">Астероид (открывается перелётами):</p>
        <div className="skins">
          <button
            type="button"
            className={`skin ${asteroidSkin === null ? 'skin--on' : ''}`}
            onClick={() => setAsteroidSkin(null)}
            aria-pressed={asteroidSkin === null}
          >
            <span className="skin__auto">АВТО</span>
          </button>
          {ASTEROIDS.map((sprite, i) => {
            const locked = i >= unlockedSkins
            return (
              <button
                type="button"
                key={i}
                className={`skin ${asteroidSkin === i ? 'skin--on' : ''}`}
                disabled={locked}
                onClick={() => setAsteroidSkin(i)}
                aria-pressed={asteroidSkin === i}
                aria-label={locked ? `Астероид ${i + 1} (закрыт)` : `Астероид ${i + 1}`}
                title={locked ? `Откроется после ${i} перелёт(а)` : undefined}
              >
                <img className="pixel" src={sprite} alt="" width={48} height={48} />
                {locked && <span className="skin__lock" aria-hidden="true">🔒</span>}
              </button>
            )
          })}
        </div>
      </section>
      <section>
        <h3>Сохранение</h3>
        <div className="actions">
          <button type="button" className="btn" onClick={() => { save(Date.now()); notify('info', 'Сохранено') }}>
            Сохранить сейчас
          </button>
        </div>
      </section>
      <section>
        <h3>Экспорт</h3>
        <div className="actions">
          <button type="button" className="btn" onClick={onExport}>
            Показать код
          </button>
          <button type="button" className="btn" onClick={() => void onCopy()} disabled={!exported}>
            Скопировать
          </button>
        </div>
        {exported && <textarea className="code" readOnly value={exported} aria-label="Код экспорта" rows={4} />}
      </section>
      <section>
        <h3>Импорт</h3>
        <textarea
          className="code"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          aria-label="Код импорта"
          placeholder="Вставьте код экспорта"
          rows={4}
        />
        <div className="actions">
          <button type="button" className="btn" onClick={onImport} disabled={!importText.trim()}>
            Импортировать
          </button>
        </div>
      </section>
      <section>
        <h3>Сброс</h3>
        <div className="actions">
          <button type="button" className={`btn ${confirmReset ? 'btn--danger' : ''}`} onClick={onReset}>
            {confirmReset ? 'Точно сбросить всё?' : 'Полный сброс'}
          </button>
          {confirmReset && (
            <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
              Отмена
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
