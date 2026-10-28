import { describe, expect, it } from 'vitest'
import { getCharacterAssetScale, getCompactCharacterOffsetY, getHomeCharacterScale, getOnboardingCharacterScale } from './characterSizing'

describe('character visual sizing', () => {
  it('renders every supplied PNG at its authored 100% proportions', () => {
    expect(getCharacterAssetScale('frog')).toBe(1)
    expect(getCharacterAssetScale('pig')).toBe(1)
    expect(getCharacterAssetScale('dinosaur')).toBe(1)
    expect(getCharacterAssetScale('squirrel')).toBe(1)
  })

  it('does not enlarge user-uploaded characters unexpectedly', () => {
    expect(getCharacterAssetScale('custom-123')).toBe(1)
  })

  it('maps every slider step to a visibly different home-safe size', () => {
    expect(getHomeCharacterScale(0.5)).toBeCloseTo(0.6)
    expect(getHomeCharacterScale(0.8)).toBeCloseTo(0.798)
    expect(getHomeCharacterScale(1)).toBeCloseTo(0.93)
    expect(getHomeCharacterScale(1.2)).toBeCloseTo(0.93)
    expect(getHomeCharacterScale(0.8)).toBeLessThan(getHomeCharacterScale(0.81))
  })

  it('keeps every complete PNG on its natural baseline in customization', () => {
    expect(getCompactCharacterOffsetY('frog')).toBe('0%')
    expect(getCompactCharacterOffsetY('pig')).toBe('0%')
    expect(getCompactCharacterOffsetY('dinosaur')).toBe('0%')
    expect(getCompactCharacterOffsetY('squirrel')).toBe('0%')
    expect(getCompactCharacterOffsetY('custom-123')).toBe('0%')
  })

  it('compensates the smaller visible frog artwork in onboarding', () => {
    expect(getOnboardingCharacterScale('frog')).toBeCloseTo(1.28)
    expect(getOnboardingCharacterScale('pig')).toBe(1)
    expect(getOnboardingCharacterScale('dinosaur')).toBe(1)
    expect(getOnboardingCharacterScale('squirrel')).toBe(1)
  })
})
