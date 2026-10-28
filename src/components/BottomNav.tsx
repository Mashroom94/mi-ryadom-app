import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { isPrimaryNavItemActive, primaryNavItems } from '../services/navigation'

export function BottomNav() {
  const { t } = useApp()
  const { pathname } = useLocation()
  return (
    <nav className="bottom-nav" aria-label={t('primaryNavigation')}>
      <div className="bottom-nav__inner">
        {primaryNavItems.map(({ to, key, icon }) => (
          <Link key={to} to={to} aria-current={isPrimaryNavItemActive(key, pathname) ? 'page' : undefined} className={`bottom-nav__item${isPrimaryNavItemActive(key, pathname) ? ' is-active' : ''}`}>
            <span className="bottom-nav__icon"><img src={icon} alt="" aria-hidden="true" /></span>
            <span>{t(key)}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

