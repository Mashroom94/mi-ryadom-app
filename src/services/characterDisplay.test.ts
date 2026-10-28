import { describe, expect, it } from 'vitest'
import { characters, createDefaultState } from '../data/defaults'
import type { SharedProfile } from '../models/types'
import { resolveDisplayedCharacter } from './characterDisplay'

describe('resolveDisplayedCharacter', () => {
  it('shows the partner character on the home screen instead of the local selection', () => {
    const state = createDefaultState('ru')
    state.customization.characterId = 'pig'
    const partnerProfile: SharedProfile = {
      customization: { ...state.customization, characterId: 'squirrel', scale: 0.82 },
      customCharacters: [],
      wishlist: [],
      ideas: [],
    }

    const displayed = resolveDisplayedCharacter('partner', state, partnerProfile)

    expect(displayed.character.id).toBe('squirrel')
    expect(displayed.customization.scale).toBe(0.82)
  })

  it('never substitutes the local custom character while partner state is loading', () => {
    const state = createDefaultState('ru')
    state.customization.characterId = 'mine'
    state.customCharacters = [{ id: 'mine', kind: 'uploaded-image', nameKey: 'customCharacter', accent: '#fff', assetPath: 'data:image/webp;base64,mine' }]

    const displayed = resolveDisplayedCharacter('partner', state)

    expect(displayed.character).toEqual(characters[0])
    expect(displayed.character.id).not.toBe('mine')
  })
})
