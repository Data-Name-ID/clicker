import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MockAdProvider } from '../ads/MockAdProvider'
import { AdModal } from './AdModal'

describe('AdModal with MockAdProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not reward when closed before the countdown ends', async () => {
    const provider = new MockAdProvider()
    render(<AdModal provider={provider} />)
    let promise!: Promise<string>
    act(() => {
      promise = provider.showRewarded('boost')
    })

    expect(screen.getByRole('button', { name: 'Забрать награду' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))

    await expect(promise).resolves.toBe('dismissed')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('rewards only after the countdown', async () => {
    const provider = new MockAdProvider()
    render(<AdModal provider={provider} />)
    let promise!: Promise<string>
    act(() => {
      promise = provider.showRewarded('supply')
    })

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Забрать награду' }))

    await expect(promise).resolves.toBe('rewarded')
  })

  it('reports failed when an ad is already showing', async () => {
    const provider = new MockAdProvider()
    act(() => {
      void provider.showRewarded('boost')
    })

    await expect(provider.showRewarded('supply')).resolves.toBe('failed')
  })
})
