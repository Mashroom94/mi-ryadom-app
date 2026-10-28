import { describe, expect, it } from 'vitest'
import { createDefaultState } from '../data/defaults'
import { createSharedProfile } from './sharedProfile'
import { createEventEnvelope } from './eventEnvelope'

describe('createEventEnvelope', () => {
  it('sends the exact customized character snapshot with the event', () => {
    const state = createDefaultState('ru')
    state.customCharacters = [{ id: 'face', kind: 'face-mask', nameKey: 'customCharacter', accent: '#fff', bodyCharacterId: 'pig', name: 'Face', faceDataUrl: 'data:image/jpeg;base64,AA', faceScale: 3.4, faceOffsetX: -17, faceOffsetY: 28 }]
    state.customization.characterId = 'face'
    const envelope = createEventEnvelope({ id: '1', type: 'customization', payload: 'face', createdAt: '2026-01-01', direction: 'sent', delivery: 'local' }, createSharedProfile(state))
    const restored = JSON.parse(JSON.stringify(envelope))
    expect(restored.state.customCharacters[0]).toMatchObject({ faceScale: 3.4, faceOffsetX: -17, faceOffsetY: 28 })
    expect(restored.state.customization.characterId).toBe('face')
  })
})
