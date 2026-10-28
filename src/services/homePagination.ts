export type HomePageId = 'partner' | 'self'
export type CharacterSceneRole = 'foreground' | 'background'
export type DeliveryState = 'sent' | 'queued' | 'failed'

export function characterSceneRole(page: HomePageId, owner: HomePageId): CharacterSceneRole {
  return page === owner ? 'foreground' : 'background'
}

export function resolveHomePage(search: string): HomePageId {
  return new URLSearchParams(search).get('page') === 'me' ? 'self' : 'partner'
}

export function pageAfterSwipe(current: HomePageId, deltaX: number): HomePageId {
  if (deltaX <= -64) return 'self'
  if (deltaX >= 64) return 'partner'
  return current
}

export function shouldCelebrateStickerDelivery(status: DeliveryState): boolean {
  return status === 'sent'
}

const interactiveSwipeTargets = new Set(['A', 'BUTTON', 'INPUT', 'LABEL', 'SELECT', 'TEXTAREA'])

export function isHomeSwipeSurface(tagName: string, contentEditable: boolean): boolean {
  return !contentEditable && !interactiveSwipeTargets.has(tagName.toUpperCase())
}
