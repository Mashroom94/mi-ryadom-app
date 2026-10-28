import { describe, expect, it } from 'vitest'
import { createDefaultState } from '../data/defaults'
import { resolveIncomingSound } from './incomingSound'

describe('resolveIncomingSound', () => {
  it('uses the sound selected by the partner who sent the event', () => {
    const state = createDefaultState('ru')
    state.profile.soundEnabled = true
    state.partnerShared = {
      customization: { ...state.customization, characterId: 'frog', notificationSound: 'croak' },
      customCharacters: [],
      wishlist: [],
      ideas: [],
      plans: [],
    }

    expect(resolveIncomingSound(state)).toEqual({
      characterId: 'frog',
      mode: 'croak',
      customSoundDataUrl: undefined,
    })
  })

  it('does not play incoming audio when sound is disabled', () => {
    const state = createDefaultState('ru')
    state.profile.soundEnabled = false

    expect(resolveIncomingSound(state)).toBeNull()
  })
})
