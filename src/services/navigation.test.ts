import { describe, expect, it } from 'vitest'
import { backTargetFor, isBackSwipe, isPrimaryNavItemActive, primaryNavItems, shouldResetScroll } from './navigation'

describe('primary navigation', () => {
  it('keeps only home and shared space in the compact island', () => {
    expect(primaryNavItems.map((item) => [item.key, item.to])).toEqual([
      ['home', '/'],
      ['notes', '/notes'],
    ])
  })

  it('keeps ideas and wishlist inside the notes destination', () => {
    expect(isPrimaryNavItemActive('notes', '/ideas')).toBe(true)
    expect(isPrimaryNavItemActive('notes', '/wishlist')).toBe(true)
  })

  it('returns a safe in-app destination for every inner page', () => {
    expect(backTargetFor('/ideas')).toBe('/notes')
    expect(backTargetFor('/wishlist')).toBe('/notes')
    expect(backTargetFor('/customize')).toBe('/profile')
    expect(backTargetFor('/notes')).toBe('/')
    expect(backTargetFor('/profile')).toBe('/')
  })

  it('recognizes a deliberate right swipe from the left edge', () => {
    expect(isBackSwipe({ startX: 18, startY: 120, endX: 110, endY: 132 })).toBe(true)
    expect(isBackSwipe({ startX: 60, startY: 120, endX: 160, endY: 120 })).toBe(false)
    expect(isBackSwipe({ startX: 18, startY: 120, endX: 75, endY: 190 })).toBe(false)
  })

  it('resets scroll only when navigation opens a different route', () => {
    expect(shouldResetScroll('/', '/notes')).toBe(true)
    expect(shouldResetScroll('/notes', '/profile')).toBe(true)
    expect(shouldResetScroll('/profile', '/profile')).toBe(false)
  })
})
