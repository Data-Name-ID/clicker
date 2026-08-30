import { describe, expect, it } from 'vitest'
import { formatDuration, formatNumber, formatRate } from './format'

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [999.7, '999'],
    [1000, '1 тыс'],
    [1234, '1,2 тыс'],
    [999_950, '1 млн'],
    [3_400_000, '3,4 млн'],
    [5_600_000_000, '5,6 млрд'],
    [7_800_000_000_000, '7,8 трлн'],
    [1.5e15, '1.5e15'],
    [-1234, '−1,2 тыс'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatNumber(input)).toBe(expected)
  })
})

describe('formatRate', () => {
  it.each([
    [0.5, '0,5'],
    [5, '5'],
    [-2.25, '−2,3'],
    [12_345, '12,3 тыс'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatRate(input)).toBe(expected)
  })
})

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [65_000, '1:05'],
    [3_723_000, '1:02:03'],
  ])('formats %s ms as %s', (input, expected) => {
    expect(formatDuration(input)).toBe(expected)
  })
})
