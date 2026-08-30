import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithStore } from '../../test/renderWithStore'
import { BuildingCard } from './BuildingCard'

describe('BuildingCard', () => {
  it('disables the buy button without resources', () => {
    renderWithStore(<BuildingCard id="drone" amount={1} />, { resources: { ore: 14 } })

    expect(screen.getByRole('button', { name: 'Купить Буровой дрон ×1' })).toBeDisabled()
  })

  it('buys a drone when affordable', () => {
    const { store } = renderWithStore(<BuildingCard id="drone" amount={1} />, { resources: { ore: 15 } })

    fireEvent.click(screen.getByRole('button', { name: 'Купить Буровой дрон ×1' }))

    expect(store.getState().game.buildings.drone).toBe(1)
    expect(store.getState().game.resources.ore).toBe(0)
  })

  it('shows starving smelters', () => {
    renderWithStore(<BuildingCard id="smelter" amount={1} />, {
      buildings: { smelter: 2 },
      efficiency: { smelter: 0.4 },
    })

    expect(screen.getByText('Эффективность 40 % — не хватает руды')).toBeInTheDocument()
  })
})
