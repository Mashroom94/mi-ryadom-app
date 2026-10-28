import type { CustomizationSettings } from '../models/types'

export const onboardingCustomizationFields = ['characterId', 'scale', 'animationEnabled'] as const satisfies ReadonlyArray<keyof CustomizationSettings>
