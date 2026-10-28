import { describe, expect, it } from 'vitest'
import { shouldSendTouch } from './touchThrottle'

describe('shouldSendTouch', () => {
  it('treats repeated touches within ten seconds as one gesture', () => {
    expect(shouldSendTouch(null, 1000)).toBe(true)
    expect(shouldSendTouch(1000, 10_999)).toBe(false)
    expect(shouldSendTouch(1000, 11_000)).toBe(true)
  })
})
