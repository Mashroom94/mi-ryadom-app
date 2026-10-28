import { describe, expect, it } from 'vitest'
import { deliveryFeedbackKey } from './deliveryFeedback'

describe('delivery feedback', () => {
  it('describes the sent content instead of notification delivery', () => {
    expect(deliveryFeedbackKey('sign', 'sent')).toBe('signSent')
    expect(deliveryFeedbackKey('sticker', 'sent')).toBe('stickerSent')
  })

  it('does not expose the sticker queue state to the sender', () => {
    expect(deliveryFeedbackKey('sign', 'queued')).toBe('signQueued')
    expect(deliveryFeedbackKey('sticker', 'queued')).toBe('stickerSent')
  })
})
