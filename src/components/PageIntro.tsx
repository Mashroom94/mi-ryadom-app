import { ChevronLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { backTargetFor } from '../services/navigation'
import { useApp } from '../context/AppContext'

export function PageIntro({ title, description, action, backLabel, showBack = true }: { title: string; description: string; action?: React.ReactNode; backLabel?: string; showBack?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useApp()

  return (
    <header className={`page-intro${showBack ? '' : ' page-intro--root'}`}>
      {showBack && <button className="page-back" type="button" aria-label={backLabel ?? t('back')} onClick={() => navigate(backTargetFor(location.pathname))}>
        <ChevronLeft aria-hidden="true" />
      </button>}
      <div className="page-intro__copy">
        <h1>{title}</h1>
        <p>{description}</p>
        {action && <div className="page-intro__action">{action}</div>}
      </div>
    </header>
  )
}

