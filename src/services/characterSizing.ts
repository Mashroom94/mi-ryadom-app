const PRESET_VISUAL_SCALES: Record<string, number> = {
  pig: 1,
  frog: 1,
  dinosaur: 1,
  squirrel: 1,
}

const COMPACT_VERTICAL_OFFSETS: Record<string, string> = {
  pig: '0%',
  frog: '0%',
  dinosaur: '0%',
  squirrel: '0%',
}

const ONBOARDING_VISUAL_SCALES: Record<string, number> = {
  pig: 1,
  frog: 1.28,
  dinosaur: 1,
  squirrel: 1,
}

export function getCharacterAssetScale(characterId: string): number {
  return PRESET_VISUAL_SCALES[characterId] ?? 1
}

export function getHomeCharacterScale(scale: number): number {
  // Map the full 50–100% control range onto the responsive stage. Each slider
  // step must remain visible while the authored 100% size stays home-safe.
  return Math.min(0.93, Math.max(0.6, 0.27 + scale * 0.66))
}

export function getCompactCharacterOffsetY(characterId: string): string {
  return COMPACT_VERTICAL_OFFSETS[characterId] ?? '0%'
}

export function getOnboardingCharacterScale(characterId: string): number {
  return ONBOARDING_VISUAL_SCALES[characterId] ?? 1
}
