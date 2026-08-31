import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithStore } from '../../test/renderWithStore'
import { SkillsPanel } from './SkillsPanel'

describe('SkillsPanel', () => {
  it('shows the level and free points', () => {
    renderWithStore(<SkillsPanel />, { xp: 235 })

    expect(screen.getByText('Уровень 2')).toBeInTheDocument()
    expect(screen.getByText('Очков навыков: 2')).toBeInTheDocument()
  })

  it('selects a star and learns it from the info card', () => {
    const { store } = renderWithStore(<SkillsPanel />, { xp: 100 })

    fireEvent.click(screen.getByTestId('skill-miner1'))
    expect(screen.getByTestId('star-info')).toHaveTextContent('Крепкая рука')

    fireEvent.click(screen.getByRole('button', { name: 'Изучить' }))

    expect(store.getState().game.skills).toEqual(['miner1'])
    expect(screen.getByText('Очков навыков: 0')).toBeInTheDocument()
    expect(screen.getByTestId('star-info')).toHaveTextContent('Изучено')
  })

  it('locked star explains its requirements in the info card', () => {
    renderWithStore(<SkillsPanel />, { xp: 500 })

    fireEvent.click(screen.getByTestId('skill-miner4'))

    expect(screen.getByTestId('star-info')).toHaveTextContent('Нужно: Точный удар')
    expect(screen.getByRole('button', { name: 'Изучить' })).toBeDisabled()
  })
})

describe('SkillsPanel interactivity', () => {
  it('shows the hovered skill in the sky status line', () => {
    renderWithStore(<SkillsPanel />)

    fireEvent.mouseEnter(screen.getByTestId('skill-miner3'))

    expect(screen.getByTestId('status-miner')).toHaveTextContent('Широкий захват — Удар вдвое сильнее')
  })

  it('clears the status line on mouse leave', () => {
    renderWithStore(<SkillsPanel />)

    fireEvent.mouseEnter(screen.getByTestId('skill-miner3'))
    fireEvent.mouseLeave(screen.getByTestId('skill-miner3'))

    expect(screen.getByTestId('status-miner')).toHaveTextContent('Наведи на звезду')
  })
})
