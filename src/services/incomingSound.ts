import type { AppState, CharacterSound } from '../models/types'

export interface IncomingSoundSettings {
  characterId: string
  mode: CharacterSound
  customSoundDataUrl?: string
}

export function resolveIncomingSound(state: Pick<AppState, 'profile' | 'customization' | 'partnerShared'>): IncomingSoundSettings | null {
  if (!state.profile.soundEnabled) return null
  const customization = state.partnerShared?.customization ?? state.customization
  return {
    characterId: customization.characterId,
    mode: customization.notificationSound,
    customSoundDataUrl: customization.customSoundDataUrl,
  }
}
