import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { applyWaitingUpdate } from '../services/pwaUpdate'

export function UpdateBanner() {
  const { t } = useApp()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const show = () => setVisible(true)
    window.addEventListener('my-ryadom:update-available', show)
    return () => window.removeEventListener('my-ryadom:update-available', show)
  }, [])
  if (!visible) return null
  return <aside className="update-banner" role="status"><span>{t('updateAvailable')}</span><button type="button" onClick={() => applyWaitingUpdate()}>{t('updateNow')}</button></aside>
}
