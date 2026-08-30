import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithStore } from '../../test/renderWithStore'
import { Asteroid } from './Asteroid'
import { ResourceBar } from './ResourceBar'

describe('Asteroid', () => {
  it('adds ore on click', () => {
    renderWithStore(
      <>
        <ResourceBar />
        <Asteroid />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Добыть руду' }))

    expect(screen.getByTestId('amount-ore')).toHaveTextContent('1')
  })

  it('applies click upgrades to the gain', () => {
    const { store } = renderWithStore(<Asteroid />, { upgrades: ['click1'] })

    fireEvent.click(screen.getByRole('button', { name: 'Добыть руду' }))

    expect(store.getState().game.resources.ore).toBe(2)
  })
})
