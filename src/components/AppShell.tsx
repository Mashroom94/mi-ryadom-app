import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SplashScreen } from './SplashScreen'
import { Onboarding } from './Onboarding'
import { UpdateBanner } from './UpdateBanner'
import { backTargetFor, isBackSwipe, shouldResetScroll } from '../services/navigation'

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const previousPathname = useRef(location.pathname)

  useEffect(() => {
    if (shouldResetScroll(previousPathname.current, location.pathname)) window.scrollTo({ top: 0, left: 0 })
    previousPathname.current = location.pathname
  }, [location.pathname])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      swipeStart.current = event.pointerType !== 'mouse' && event.clientX <= 28 ? { x: event.clientX, y: event.clientY } : null
    }
    const onPointerUp = (event: PointerEvent) => {
      const start = swipeStart.current
      swipeStart.current = null
      if (!start || location.pathname === '/') return
      if (isBackSwipe({ startX: start.x, startY: start.y, endX: event.clientX, endY: event.clientY })) navigate(backTargetFor(location.pathname))
    }
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [location.pathname, navigate])

  return (
    <div className="app-shell">
      <SplashScreen />
      <Onboarding />
      <UpdateBanner />
      <main className={`app-main${location.pathname === '/' ? ' app-main--home' : ''}`}><Outlet /></main>
      <BottomNav />
    </div>
  )
}

