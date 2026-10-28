const UPDATE_INTERVAL_MS = 30_000
let registration: ServiceWorkerRegistration | null = null
let reloadListenerArmed = false
let controllerReloaded = false
let lastUpdateCheck = 0

export function shouldReloadOnControllerChange(alreadyReloaded: boolean) {
  return !alreadyReloaded
}

export function shouldCheckForUpdate(lastCheckedAt: number, now: number, minimumIntervalMs = UPDATE_INTERVAL_MS) {
  return lastCheckedAt === 0 || now - lastCheckedAt >= minimumIntervalMs
}

function reloadOnControllerChange() {
  if (reloadListenerArmed) return
  reloadListenerArmed = true
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!shouldReloadOnControllerChange(controllerReloaded)) return
    controllerReloaded = true
    window.location.reload()
  }, { once: true })
}

function activateWaitingWorker(current: ServiceWorkerRegistration) {
  if (!current.waiting) return false
  reloadOnControllerChange()
  current.waiting.postMessage({ type: 'SKIP_WAITING' })
  return true
}

async function checkForUpdate() {
  if (!registration) return
  const now = Date.now()
  if (!shouldCheckForUpdate(lastUpdateCheck, now)) return
  lastUpdateCheck = now
  try {
    await registration.update()
    activateWaitingWorker(registration)
  } catch { /* A later focus/visibility check will retry when the network returns. */ }
}

export async function registerPwa() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
  registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
  if (activateWaitingWorker(registration)) return
  registration.addEventListener('updatefound', () => {
    const installing = registration?.installing
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) {
        activateWaitingWorker(registration!)
      }
    })
  })
  const refreshWhenVisible = () => {
    if (document.visibilityState === 'visible') void checkForUpdate()
  }
  window.addEventListener('focus', refreshWhenVisible)
  window.addEventListener('pageshow', refreshWhenVisible)
  document.addEventListener('visibilitychange', refreshWhenVisible)
  window.setInterval(refreshWhenVisible, UPDATE_INTERVAL_MS)
  void checkForUpdate()
}

export function applyWaitingUpdate() {
  if (!registration?.waiting) return false
  return activateWaitingWorker(registration)
}

export async function serviceWorkerDebugState() {
  if (!('serviceWorker' in navigator)) return 'unsupported'
  const current = registration ?? await navigator.serviceWorker.getRegistration()
  if (!current) return 'not registered'
  if (current.waiting) return 'waiting'
  if (current.installing) return `installing: ${current.installing.state}`
  return current.active ? `active: ${current.active.state}` : 'registered'
}
