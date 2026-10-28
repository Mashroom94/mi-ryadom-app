import { describe, expect, it } from 'vitest'
import { characterSceneRole, isHomeSwipeSurface, pageAfterSwipe, resolveHomePage, shouldCelebrateStickerDelivery } from './homePagination'

describe('home pagination', () => {
  it('opens the partner page by default and restores the own page from the URL', () => {
    expect(resolveHomePage('')).toBe('partner')
    expect(resolveHomePage('?page=me')).toBe('self')
  })

  it('switches pages only after a deliberate horizontal swipe', () => {
    expect(pageAfterSwipe('partner', -80)).toBe('self')
    expect(pageAfterSwipe('self', 80)).toBe('partner')
    expect(pageAfterSwipe('partner', -30)).toBe('partner')
  })

  it('keeps both characters in one scene and swaps their depth with the page', () => {
    expect(characterSceneRole('partner', 'partner')).toBe('foreground')
    expect(characterSceneRole('partner', 'self')).toBe('background')
    expect(characterSceneRole('self', 'partner')).toBe('background')
    expect(characterSceneRole('self', 'self')).toBe('foreground')
  })

  it('animates a sticker only after confirmed delivery', () => {
    expect(shouldCelebrateStickerDelivery('sent')).toBe(true)
    expect(shouldCelebrateStickerDelivery('queued')).toBe(false)
    expect(shouldCelebrateStickerDelivery('failed')).toBe(false)
  })

  it('never starts page pagination from interactive customization controls', () => {
    expect(isHomeSwipeSurface('DIV', false)).toBe(true)
    expect(isHomeSwipeSurface('INPUT', false)).toBe(false)
    expect(isHomeSwipeSurface('BUTTON', false)).toBe(false)
    expect(isHomeSwipeSurface('DIV', true)).toBe(false)
  })
})
