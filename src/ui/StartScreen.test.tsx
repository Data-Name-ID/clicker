import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithStore } from '../../test/renderWithStore'
import { StartScreen } from './StartScreen'

describe('StartScreen', () => {
  it('shows the dedication title', () => {
    renderWithStore(<StartScreen />)

    expect(screen.getByRole('heading', { name: 'Для Максона' })).toBeInTheDocument()
    expect(screen.getByText('от Data Name ID')).toBeInTheDocument()
  })

  it('hides after pressing play', () => {
    const { store } = renderWithStore(<StartScreen />)

    fireEvent.click(screen.getByRole('button', { name: 'Играть' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(store.getState().started).toBe(true)
  })
})
