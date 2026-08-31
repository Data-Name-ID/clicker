import { describe, expect, it } from 'vitest'
import { buildState } from '../../test/builders'
import { clickValue, comboWindowMs, darkMatterMultiplier, dischargeSeconds, applyDischarge, performClick } from './economy'
import { addXp, canLearnSkill, learnSkill, levelFromXp, levelProgress, skillPoints } from './skills'

describe('levels', () => {
  it('level 0 below 100 xp, level 1 at 100', () => {
    expect(levelFromXp(99)).toBe(0)
    expect(levelFromXp(100)).toBe(1)
    expect(levelFromXp(235)).toBe(2)
  })

  it('reports progress into the current level', () => {
    expect(levelProgress(150)).toEqual({ level: 1, into: 50, need: 135 })
  })

  it('skill points are level minus learned skills', () => {
    expect(skillPoints(buildState({ xp: 235, skills: ['miner1'] }))).toBe(1)
  })
})

describe('addXp', () => {
  it('dark sense grants 10 % more', () => {
    expect(addXp(buildState(), 100).xp).toBe(100)
    expect(addXp(buildState({ skills: ['dark1'] }), 100).xp).toBeCloseTo(110, 10)
  })
})

describe('learnSkill', () => {
  it('requires points and prerequisites', () => {
    expect(canLearnSkill(buildState({ xp: 100 }), 'miner1')).toBe(true)
    expect(canLearnSkill(buildState({ xp: 100 }), 'miner2')).toBe(false)
    expect(canLearnSkill(buildState({ xp: 0 }), 'miner1')).toBe(false)
    expect(canLearnSkill(buildState({ xp: 100, skills: ['miner1'] }), 'miner1')).toBe(false)
  })

  it('learns along the chain', () => {
    const state = buildState({ xp: 1000, skills: ['miner1'] })

    expect(learnSkill(state, 'miner2')?.skills).toEqual(['miner1', 'miner2'])
  })
})

describe('skill effects', () => {
  it('miner clicks multiply', () => {
    expect(clickValue(buildState({ skills: ['miner1'] }))).toBe(1.5)
    expect(clickValue(buildState({ skills: ['miner1', 'miner3', 'miner8'] }))).toBe(6)
  })

  it('crit skill raises the multiplier to 15', () => {
    expect(performClick(buildState({ skills: ['miner1', 'miner2', 'miner4'] }), 0, 0.01).gain).toBeCloseTo(22.5, 10)
  })

  it('echo doubles the click on a lucky roll', () => {
    expect(performClick(buildState({ skills: ['miner1', 'miner3', 'miner5'] }), 0, 1, 1, 0.05).gain).toBe(6)
    expect(performClick(buildState({ skills: ['miner1', 'miner3', 'miner5'] }), 0, 1, 1, 0.5).gain).toBe(3)
  })

  it('hammer skill widens the combo window', () => {
    expect(comboWindowMs(buildState({ skills: ['miner6'] }))).toBe(3000)
  })

  it('mountain wrath extends the discharge', () => {
    const state = buildState({ buildings: { drone: 10 }, charge: 100, skills: ['miner7'] })

    expect(dischargeSeconds(state)).toBe(90)
    expect(applyDischarge(state).resources.ore).toBe(450)
  })

  it('deep dark raises the soft cap', () => {
    expect(darkMatterMultiplier(buildState({ darkMatter: 120, skills: ['dark2'] }))).toBe(13)
  })
})
