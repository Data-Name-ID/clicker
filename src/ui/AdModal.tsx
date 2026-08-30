import { useEffect, useState, useSyncExternalStore } from 'react'
import { mockAdProvider } from '../ads'
import { MOCK_AD_COUNTDOWN_SECONDS, type MockAdProvider } from '../ads/MockAdProvider'

interface AdModalProps {
  provider?: MockAdProvider
}

export function AdModal({ provider = mockAdProvider }: AdModalProps) {
  const request = useSyncExternalStore(provider.subscribe, provider.getRequest, provider.getRequest)
  const [left, setLeft] = useState(MOCK_AD_COUNTDOWN_SECONDS)

  useEffect(() => {
    if (!request) return
    setLeft(MOCK_AD_COUNTDOWN_SECONDS)
    const timer = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000)
    return () => clearInterval(timer)
  }, [request])

  if (!request) return null
  const done = left <= 0

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="ad-title">
      <div className="modal frame modal--ad">
        <h2 id="ad-title">Реклама</h2>
        <div className="ad-screen" aria-live="polite">
          <p className="ad-screen__text">Здесь могла быть ваша реклама</p>
          <p className="ad-screen__timer">{done ? 'Готово' : `${left} с`}</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn--primary" disabled={!done} onClick={() => provider.finish('rewarded')}>
            Забрать награду
          </button>
          <button type="button" className="btn" onClick={() => provider.finish('dismissed')}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
