export const primaryNavItems = [
  { to: '/', key: 'home', icon: '/assets/navigation/nav_home.svg' },
  { to: '/notes', key: 'notes', icon: '/assets/navigation/nav_ideas.svg' },
] as const

export type PrimaryNavKey = typeof primaryNavItems[number]['key']

const backTargets: Record<string, string> = {
  '/ideas': '/notes',
  '/wishlist': '/notes',
  '/customize': '/profile',
  '/notes': '/',
  '/profile': '/',
}

export interface SwipeCoordinates {
  startX: number
  startY: number
  endX: number
  endY: number
}

export function isPrimaryNavItemActive(key: PrimaryNavKey, pathname: string): boolean {
  if (key === 'home') return pathname === '/'
  if (key === 'notes') return ['/notes', '/ideas', '/wishlist'].includes(pathname)
  return false
}

export function backTargetFor(pathname: string): string {
  return backTargets[pathname] ?? '/'
}

export function shouldResetScroll(previousPathname: string, nextPathname: string): boolean {
  return previousPathname !== nextPathname
}

export function isBackSwipe({ startX, startY, endX, endY }: SwipeCoordinates): boolean {
  const horizontalDistance = endX - startX
  const verticalDistance = Math.abs(endY - startY)
  return startX <= 28 && horizontalDistance >= 72 && verticalDistance <= 48 && horizontalDistance > verticalDistance * 1.4
}
