import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithStore } from '../../test/renderWithStore'
import { BuffBar } from './BuffBar'

describe('BuffBar', () => {
  it('is empty without effects', () => {
    renderWithStore(<BuffBar />)

    expect(screen.queryByTestId('buff-bar')).not.toBeInTheDocument()
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
})
