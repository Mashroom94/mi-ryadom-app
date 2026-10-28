import { describe, expect, it } from 'vitest'
import { onboardingCustomizationFields } from './onboardingCustomization'

describe('first-run customization', () => {
  it('shows only character, scale, and animation controls', () => {
    expect(onboardingCustomizationFields).toEqual(['characterId', 'scale', 'animationEnabled'])
    expect(onboardingCustomizationFields).not.toContain('backgroundId')
  })
})
