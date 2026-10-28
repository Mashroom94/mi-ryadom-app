import { describe, expect, it } from 'vitest'
import { notesTabAfterSwipe } from './notesTabs'

describe('notes tab swipe', () => {
  it('moves through tabs in both directions and respects the threshold', () => {
    expect(notesTabAfterSwipe('together', -80)).toBe('play')
    expect(notesTabAfterSwipe('play', -80)).toBe('money')
    expect(notesTabAfterSwipe('money', 80)).toBe('play')
    expect(notesTabAfterSwipe('play', 20)).toBe('play')
  })
})
