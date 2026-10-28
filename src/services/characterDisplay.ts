import { characters, createDefaultState } from '../data/defaults'
import type { AppState } from '../models/types'

export function resolveDisplayedCharacter(mode: 'partner' | 'self', state: AppState, partnerProfile = state.partnerShared) {
  if (mode === 'self') {
    const character = [...characters, ...state.customCharacters].find((item) => item.id === state.customization.characterId) ?? characters[0]
    return { character, customization: state.customization, customCharacters: state.customCharacters }
  }

  const fallback = createDefaultState(state.profile.language).customization
  const customization = partnerProfile?.customization ?? fallback
  const customCharacters = partnerProfile?.customCharacters ?? []
  const character = [...characters, ...customCharacters].find((item) => item.id === customization.characterId) ?? characters[0]
  return { character, customization, customCharacters }
}
