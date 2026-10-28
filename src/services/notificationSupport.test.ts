import { describe, expect, it } from 'vitest'
import { notificationSupportStatus } from './notificationSupport'

describe('notificationSupportStatus', () => {
  it('asks an iPhone browser user to install the app instead of saying notifications are unsupported', () => {
    expect(notificationSupportStatus({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', standalone: false, hasNotification: false, hasServiceWorker: true, hasPushManager: false })).toBe('ios-install-required')
  })

  it('supports an installed iPhone web app with push APIs', () => {
    expect(notificationSupportStatus({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', standalone: true, hasNotification: true, hasServiceWorker: true, hasPushManager: true })).toBe('supported')
  })

  it('reports a genuinely unsupported browser', () => {
    expect(notificationSupportStatus({ userAgent: 'Desktop', standalone: false, hasNotification: false, hasServiceWorker: false, hasPushManager: false })).toBe('unsupported')
  })
})
