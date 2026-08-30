import type { AdPlacement, AdProvider, AdResult } from './AdProvider'

export interface MockAdRequest {
  placement: AdPlacement
}

export const MOCK_AD_COUNTDOWN_SECONDS = 5

export class MockAdProvider implements AdProvider {
  private request: MockAdRequest | null = null
  private resolver: ((result: AdResult) => void) | null = null
  private listeners = new Set<() => void>()

  isAvailable(): boolean {
    return true
  }

  showRewarded(placement: AdPlacement): Promise<AdResult> {
    if (this.request) return Promise.resolve('failed')
    return new Promise<AdResult>((resolve) => {
      this.request = { placement }
      this.resolver = resolve
      this.emit()
    })
  }

  getRequest = (): MockAdRequest | null => this.request

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  finish(result: AdResult): void {
    const resolve = this.resolver
    this.request = null
    this.resolver = null
    this.emit()
    resolve?.(result)
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}
