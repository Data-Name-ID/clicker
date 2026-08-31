import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithStore } from '../../test/renderWithStore'
import { BuffBar } from './BuffBar'

describe('BuffBar', () => {
  it('keeps an empty slot without effects so the layout does not jump', () => {
    renderWithStore(<BuffBar />)

    expect(screen.getByTestId('buff-bar')).toBeEmptyDOMElement()
  })

  it('shows active effects with timers', () => {
    renderWithStore(<BuffBar />, {
      effects: { boostRemaining: 90, event: { id: 'goldVein', remaining: 10 } },
      artifact: 'hive',
      protocol: 'mining',
    })

    const bar = screen.getByTestId('buff-bar')
    expect(bar).toHaveTextContent('Перегрузка 1:30')
    expect(bar).toHaveTextContent('Золотая жила 0:10')
    expect(bar).toHaveTextContent('Протокол: ДОБЫЧА')
    expect(bar).toHaveTextContent('Улей')
  })

  it('lets the player accept an offer right from the bar', () => {
    const { store } = renderWithStore(<BuffBar />, {
      resources: { ore: 1000 },
      effects: { event: { id: 'caravan', remaining: 10 } },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Обменять' }))

    expect(store.getState().game.resources.alloy).toBe(300)
    expect(store.getState().game.effects.event).toBeNull()
  })
})
