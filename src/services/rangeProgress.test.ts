import { describe, expect, it } from 'vitest'
import { rangeProgress } from './rangeProgress'

describe('rangeProgress', () => {
  it('aligns the colored track with a thumb whose range starts above zero', () => {
    expect(rangeProgress(0.5, 0.5, 1)).toBe(0)
    expect(rangeProgress(0.7, 0.5, 1)).toBeCloseTo(40)
    expect(rangeProgress(1, 0.5, 1)).toBe(100)
  })
})
