import { describe, expect, it } from 'vitest'
import { canSendSelectedSign } from './signComposer'

describe('sign composer', () => {
  it('requires a selected sign and blocks duplicate sends', () => {
    expect(canSendSelectedSign(null, false)).toBe(false)
    expect(canSendSelectedSign('hug', true)).toBe(false)
    expect(canSendSelectedSign('hug', false)).toBe(true)
  })
})
