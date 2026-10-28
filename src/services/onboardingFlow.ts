export type OnboardingStep = 'intro' | 'setup' | 'pair'

export function nextOnboardingStep(step: OnboardingStep): OnboardingStep {
  if (step === 'intro') return 'setup'
  return 'pair'
}

export function resolveOnboardingStep(savedStep: string | null, registered: boolean): OnboardingStep {
  if (savedStep === 'intro' || savedStep === 'setup' || savedStep === 'pair') return savedStep
  return registered ? 'pair' : 'intro'
}
