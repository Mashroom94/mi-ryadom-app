import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem('my-ryadom:splash-seen'))

  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(() => {
      sessionStorage.setItem('my-ryadom:splash-seen', '1')
      setVisible(false)
    }, 1650)
    return () => window.clearTimeout(timer)
  }, [visible])

  if (!visible) return null
  return (
    <div className="splash-screen" role="status" aria-label="Мы рядом загружается">
      <div className="splash-mark"><img src="/icons/app-logo.svg" alt="" aria-hidden="true" /></div>
      <div className="splash-copy">
        <strong>Мы рядом</strong>
        <span>Тёплые знаки для двоих</span>
      </div>
    </div>
  )
}
