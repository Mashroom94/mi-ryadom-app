import { describe, expect, it } from 'vitest'
import { nextOnboardingStep, resolveOnboardingStep } from './onboardingFlow'

describe('onboarding flow', () => {
  it('moves through intro, setup, and pairing in order', () => {
    expect(nextOnboardingStep('intro')).toBe('setup')
    expect(nextOnboardingStep('setup')).toBe('pair')
  })

  it('restores every persisted step and defaults to the intro step', () => {
    expect(resolveOnboardingStep('intro', false)).toBe('intro')
    expect(resolveOnboardingStep('setup', false)).toBe('setup')
    expect(resolveOnboardingStep('pair', false)).toBe('pair')
    expect(resolveOnboardingStep(null, false)).toBe('intro')
    expect(resolveOnboardingStep(null, true)).toBe('pair')
  })
})
