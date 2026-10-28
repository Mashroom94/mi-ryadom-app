import { describe, expect, it } from 'vitest'
import { CUSTOM_SOUND_ACCEPT, CUSTOM_SOUND_FORMATS, MAX_CUSTOM_SOUND_BYTES, validateCustomSound } from './customSound'

describe('custom character sound', () => {
  it('accepts a small browser-playable audio file', () => {
    expect(validateCustomSound({ type: 'audio/mpeg', size: 24_000 })).toBe('ok')
  })

  it('rejects non-audio and oversized files before syncing them', () => {
    expect(validateCustomSound({ type: 'image/png', size: 24_000 })).toBe('type')
    expect(validateCustomSound({ type: 'audio/wav', size: MAX_CUSTOM_SOUND_BYTES + 1 })).toBe('size')
  })

  it('documents the browser-friendly formats shown beside the upload control', () => {
    expect(CUSTOM_SOUND_FORMATS).toBe('MP3, WAV, M4A, OGG, WebM')
    expect(CUSTOM_SOUND_ACCEPT).toContain('audio/mpeg')
    expect(CUSTOM_SOUND_ACCEPT).toContain('.m4a')
  })
})
