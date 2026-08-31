import { act, fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithStore } from '../../test/renderWithStore'
import { Tutorial } from './Tutorial'

describe('Tutorial', () => {
  it('opens the first step as a dialog with progress', () => {
    renderWithStore(<Tutorial />, { stats: { clicks: 3 } })

    expect(screen.getByRole('dialog', { name: 'Обучение' })).toHaveTextContent('Добыча')
    expect(screen.getByRole('dialog', { name: 'Обучение' })).toHaveTextContent('3 / 10')
  })

  it('collapses into a hint after "Далее"', () => {
    renderWithStore(<Tutorial />)

    fireEvent.click(screen.getByRole('button', { name: 'Далее' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('tour-hint')).toHaveTextContent('Бей по астероиду — нужно десять ударов 0 / 10')
  })

  it('reopens the dialog from the hint', () => {
    renderWithStore(<Tutorial />)
    fireEvent.click(screen.getByRole('button', { name: 'Далее' }))

    fireEvent.click(screen.getByRole('button', { name: 'Показать подсказку' }))

    expect(screen.getByRole('dialog', { name: 'Обучение' })).toBeInTheDocument()
  })

  it('opens the next step once the current one is done', () => {
    const { store } = renderWithStore(<Tutorial />, { stats: { clicks: 9 } })
    fireEvent.click(screen.getByRole('button', { name: 'Далее' }))

    act(() => store.getState().click())

    expect(screen.getByRole('dialog', { name: 'Обучение' })).toHaveTextContent('Задания')
  })

  it('switches to the buildings tab for the drone step', () => {
    const { store } = renderWithStore(<Tutorial />, { stats: { clicks: 9 } })
    act(() => store.getState().setTab('settings'))

    act(() => store.getState().click())

    expect(store.getState().tab).toBe('buildings')
  })

  it('hides after skipping', () => {
    const { store } = renderWithStore(<Tutorial />)

    fireEvent.click(screen.getByRole('button', { name: 'Пропустить обучение' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tour-hint')).not.toBeInTheDocument()
    expect(store.getState().game.tutorialDismissed).toBe(true)
  })

  it('explains combo then ads once the player earned them', () => {
    const { store } = renderWithStore(<Tutorial />, {
      stats: { clicks: 50 },
      buildings: { drone: 5 },
      tutorialSeen: ['quests'],
    })
    expect(screen.getByRole('dialog', { name: 'Обучение' })).toHaveTextContent('Ритм добычи')

    fireEvent.click(screen.getByRole('button', { name: 'Понятно' }))

    expect(screen.getByRole('dialog', { name: 'Обучение' })).toHaveTextContent('Бонусы за рекламу')
    expect(store.getState().game.tutorialSeen).toEqual(['quests', 'combo'])
  })

  it('explains ore consumption after the first smelter', () => {
    renderWithStore(<Tutorial />, {
      stats: { clicks: 50 },
      buildings: { drone: 5, smelter: 1 },
      tutorialSeen: ['quests', 'combo', 'ads'],
    })

    expect(screen.getByRole('dialog', { name: 'Обучение' })).toHaveTextContent('Расход руды')
  })

  it('offers to finish on the last step', () => {
    renderWithStore(<Tutorial />, {
      stats: { clicks: 10 },
      buildings: { drone: 1, smelter: 1, factory: 1 },
      prestigeCount: 2,
      tutorialSeen: ['quests', 'combo', 'ads', 'ore', 'events', 'skills', 'cores', 'expeditions', 'bonuses', 'shipInfo'],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Понятно' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
