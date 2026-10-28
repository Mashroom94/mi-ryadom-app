import { describe, expect, it } from 'vitest'
import { createDefaultState } from '../data/defaults'
import { createSharedProfile, mergeServerProfile, normalizeSharedProfile } from './sharedProfile'
import { resolveDisplayedCharacter } from './characterDisplay'

describe('shared profile persistence', () => {
  it('includes permanent profile settings and current mood in server state', () => {
    const state = createDefaultState('ru')
    state.user.name = 'Маша'
    state.profile.soundEnabled = true
    state.profile.vibrationEnabled = false
    state.profile.animationsEnabled = false
    state.mood = 'romance'
    state.moodUpdatedAt = '2026-10-10T10:00:00.000Z'
    state.plans.push({ id: 'plan-1', title: 'Ужин', date: '2026-10-24', completed: false, createdAt: '2026-10-21T10:00:00.000Z' })

    const profile = createSharedProfile(state)

    expect(profile.userName).toBe('Маша')
    expect(profile.profile).toEqual(state.profile)
    expect(profile.mood).toBe('romance')
    expect(profile.moodUpdatedAt).toBe('2026-10-10T10:00:00.000Z')
    expect(profile.plans).toEqual(state.plans)
  })

  it('restores server values while retaining defaults for an older payload', () => {
    const local = createDefaultState('ru')
    local.profile.soundEnabled = true
    const restored = mergeServerProfile(local, {
      schemaVersion: 2,
      customization: { ...local.customization, characterId: 'frog' },
      customCharacters: [],
      wishlist: [],
      ideas: local.ideas,
    })

    expect(restored.customization.characterId).toBe('frog')
    expect(restored.profile.soundEnabled).toBe(true)
    expect(restored.user.name).toBe(local.user.name)
  })

  it('keeps a locally chosen name when an older server profile is restored', () => {
    const local = createDefaultState('ru')
    local.user.name = 'Маша'

    const restored = mergeServerProfile(local, {
      schemaVersion: 3,
      userName: 'Мария',
      customization: local.customization,
      customCharacters: [],
      wishlist: [],
      ideas: local.ideas,
    })

    expect(restored.user.name).toBe('Маша')
  })

  it('keeps the selected photo mask and framing identical after partner sync', () => {
    const state = createDefaultState('ru')
    state.customization.characterId = 'my-photo'
    state.customCharacters = [{
      id: 'my-photo', kind: 'uploaded-image', nameKey: 'customCharacter', name: 'Фото', accent: '#fff',
      assetPath: 'data:image/jpeg;base64,PHOTO', photoShape: 'flower', photoScale: 0.73, photoOffsetX: -18, photoOffsetY: 27,
    }]
    const partner = normalizeSharedProfile(JSON.parse(JSON.stringify(createSharedProfile(state))), 'ru')
    const displayed = resolveDisplayedCharacter('partner', createDefaultState('ru'), partner)
    expect(displayed.character).toMatchObject({
      id: 'my-photo', photoShape: 'flower', photoScale: 0.73, photoOffsetX: -18, photoOffsetY: 27,
    })
  })

  it('always includes the selected transformer when older photos exceed the sync budget', () => {
    const state = createDefaultState('ru')
    state.customization.characterId = 'selected-face'
    state.customCharacters = [
      { id: 'old-photo', kind: 'uploaded-image', nameKey: 'customCharacter', accent: '#fff', assetPath: `data:image/jpeg;base64,${'A'.repeat(730_000)}` },
      { id: 'selected-face', kind: 'face-mask', nameKey: 'customCharacter', accent: '#fff', bodyCharacterId: 'pig', faceDataUrl: 'data:image/jpeg;base64,FACE', faceScale: 2.4, faceOffsetX: 12, faceOffsetY: -8 },
    ]
    const profile = createSharedProfile(state)
    expect(profile.customCharacters.map((character) => character.id)).toContain('selected-face')
    expect(profile.customCharacters.map((character) => character.id)).not.toContain('old-photo')
  })
})
