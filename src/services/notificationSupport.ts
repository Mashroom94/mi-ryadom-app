export type NotificationSupport = 'supported' | 'ios-install-required' | 'unsupported'

interface NotificationCapabilities {
  userAgent: string
  standalone: boolean
  hasNotification: boolean
  hasServiceWorker: boolean
  hasPushManager: boolean
}

export function notificationSupportStatus(capabilities: NotificationCapabilities): NotificationSupport {
  if (capabilities.hasNotification && capabilities.hasServiceWorker && capabilities.hasPushManager) return 'supported'
  if (/iPad|iPhone|iPod/i.test(capabilities.userAgent) && !capabilities.standalone) return 'ios-install-required'
  return 'unsupported'
}

export function currentNotificationSupport(): NotificationSupport {
  return notificationSupportStatus({
    userAgent: navigator.userAgent,
    standalone: Boolean((navigator as Navigator & { standalone?: boolean }).standalone) || window.matchMedia?.('(display-mode: standalone)').matches,
    hasNotification: 'Notification' in window,
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager: 'PushManager' in window,
  })
}
