import { act, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithStore } from '../../test/renderWithStore'
import { QuestPanel } from './QuestPanel'

const NOW = 1_700_000_000_000

describe('QuestPanel', () => {
  it('shows the active quest with progress', () => {
    const { store } = renderWithStore(<QuestPanel />)
    act(() => store.getState().tick(NOW + 100))

    act(() => store.getState().click())

    expect(screen.getByTestId('quest')).toHaveTextContent('Первые удары')
    expect(screen.getByTestId('quest')).toHaveTextContent('1 / 50')
  })

  it('announces a completed quest with a toast', () => {
    const { store } = renderWithStore(<QuestPanel />)
    act(() => store.getState().tick(NOW + 100))

    act(() => {
      for (let i = 0; i < 50; i += 1) store.getState().click()
    })

    expect(store.getState().toasts.map((t) => t.title)).toContain('Задание: Первые удары')
    expect(screen.getByTestId('quest')).toHaveTextContent('Пять помощников')
  })
})
