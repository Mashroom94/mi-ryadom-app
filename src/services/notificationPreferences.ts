export function syncNotificationPreferences(vibrationEnabled: boolean): void {
  if (!('serviceWorker' in navigator)) return
  void navigator.serviceWorker.ready.then((registration) => {
    const worker = navigator.serviceWorker.controller ?? registration.active
    worker?.postMessage({ type: 'SET_NOTIFICATION_PREFERENCES', vibrationEnabled })
  }).catch(() => undefined)
}
