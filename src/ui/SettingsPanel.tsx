import { useState } from 'react'
import { SaveError } from '../game/save'
import { useGame } from '../store/context'

export function SettingsPanel() {
  const exportSave = useGame((s) => s.exportSave)
  const importSave = useGame((s) => s.importSave)
  const reset = useGame((s) => s.reset)
  const save = useGame((s) => s.save)
  const notify = useGame((s) => s.notify)
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
