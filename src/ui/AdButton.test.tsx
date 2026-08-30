import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithStore } from '../../test/renderWithStore'
import { AdButton } from './AdButton'

describe('AdButton tooltip', () => {
  it('is hidden by default', () => {
    renderWithStore(<AdButton placement="boost" label="Перегрузка реактора" />)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the reward explanation on hover', () => {
    renderWithStore(<AdButton placement="boost" label="Перегрузка реактора" />)

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Перегрузка реактора' }).parentElement!)

    expect(screen.getByRole('tooltip')).toHaveTextContent('Всё производство ×2 на 10 мин.')
    expect(screen.getByRole('tooltip')).toHaveTextContent('Перезарядка 30 мин после окончания.')
  })

  it('toggles with the info button for touch screens', () => {
    renderWithStore(<AdButton placement="supply" label="Экстренная поставка" />)

    fireEvent.click(screen.getByRole('button', { name: 'Подробнее: Экстренная поставка' }))

    expect(screen.getByRole('tooltip')).toHaveTextContent('за 30 мин')

    fireEvent.click(screen.getByRole('button', { name: 'Подробнее: Экстренная поставка' }))

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the remaining cooldown', () => {
    renderWithStore(<AdButton placement="meteorShower" label="Метеоритный дождь" />, {
      cooldowns: { meteorUntil: 1_700_000_000_000 + 90_000 },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Подробнее: Метеоритный дождь' }))

    expect(screen.getByRole('tooltip')).toHaveTextContent('Снова через 1:30')
  })
})
