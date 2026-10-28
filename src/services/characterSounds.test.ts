import { describe, expect, it } from 'vitest'
import { characterSoundNotes, resolveCharacterSoundAsset } from './characterSounds'

describe('character sounds', () => {
  it('offers distinct playful grunting and croaking profiles', () => {
    expect(characterSoundNotes('pig', 'grunt')).not.toEqual(characterSoundNotes('frog', 'croak'))
    expect(characterSoundNotes('pig', 'grunt')).toHaveLength(3)
    expect(characterSoundNotes('frog', 'croak')).toHaveLength(2)
  })

  it('uses real animal recordings for grunting and croaking', () => {
    expect(resolveCharacterSoundAsset('pig', 'grunt')).toBe('/assets/sounds/pig-grunt.mp3')
    expect(resolveCharacterSoundAsset('frog', 'croak')).toBe('/assets/sounds/frog-croak.mp3')
    expect(resolveCharacterSoundAsset('pig', 'character')).toBe('/assets/sounds/pig-grunt.mp3')
    expect(resolveCharacterSoundAsset('frog', 'character')).toBe('/assets/sounds/frog-croak.mp3')
  })
})
