const BUILD_ID = '__BUILD_ID__'
const CACHE = `my-ryadom-${BUILD_ID}`
const APP_SHELL = ['/', '/manifest.webmanifest', '/icons/app-logo.svg', '/icons/app-logo.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)))
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
  if (event.data?.type === 'SET_NOTIFICATION_PREFERENCES') {
    event.waitUntil(writePreference('vibrationEnabled', event.data.vibrationEnabled !== false))
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (new URL(event.request.url).pathname.startsWith('/api/')) return
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        return response
      })
      .catch(() => caches.match(event.request).then((cached) => cached || (event.request.mode === 'navigate' ? caches.match('/') : undefined))),
  )
})

const labels = {
  mood: { calm: 'Спокойное настроение', joy: 'Радостное настроение', romance: 'Романтическое настроение', tiredness: 'Усталость', sadness: 'Грусть', anger: 'Немного злится' },
  sign: { kiss: 'Вам отправили поцелуй 💋', hug: 'Вас хотят обнять 🤗', miss: 'По вам скучают 💞', support: 'Вас поддерживают 💗' },
  sticker: { warmth: '💗', smile: '😊', star: '🏆', laugh: '😄' },
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let body = 'Ваш близкий человек отправил вам знак'
    let notificationTag = `my-ryadom-${Date.now()}`
    try {
      const device = await readDevice()
      if (device) {
        const response = await fetch('/api/events/latest', { method: 'POST', headers: { 'content-type': 'application/json', 'x-device-id': device.id, 'x-device-secret': device.secret } })
        const { event: partnerEvent } = await response.json()
        if (partnerEvent?.id && await wasEventShown(partnerEvent.id)) return
        if (partnerEvent?.id) notificationTag = `my-ryadom-${partnerEvent.id}`
        if (partnerEvent?.type === 'customization') return
        if (partnerEvent?.type === 'touch') body = 'Вас погладили и передают привет)'
        else if (partnerEvent?.type === 'wishlist' || partnerEvent?.type === 'idea') body = 'В «Наше» внесены изменения'
        else if (partnerEvent?.type === 'notes' && partnerEvent?.payload?.startsWith('drawing:')) body = 'Вам отправили рисунок'
        else if (partnerEvent?.type === 'notes' && partnerEvent?.payload === 'tic-invite') body = 'Ваш ход в крестики-нолики'
        else if (partnerEvent?.type === 'notes' && partnerEvent?.payload === 'tic-turn') body = 'Ваш ход в крестики-нолики'
        else if (partnerEvent?.type === 'notes' && partnerEvent?.payload === 'tic-result-win') body = 'Вы выиграли в крестики-нолики'
        else if (partnerEvent?.type === 'notes' && partnerEvent?.payload === 'tic-result-loss') body = 'Вы проиграли в крестики-нолики'
        else if (partnerEvent?.type === 'notes' && partnerEvent?.payload === 'tic-result-draw') body = 'У вас ничья в крестики-нолики'
        else if (partnerEvent?.type === 'notes' && partnerEvent?.payload === 'money-updated') body = 'В финансы внесены изменения'
        else if (partnerEvent?.type === 'idea') body = 'В идеи внесены изменения'
        else if (partnerEvent?.type === 'wishlist') body = 'В вишлист внесены изменения'
        else if (partnerEvent && labels[partnerEvent.type]?.[partnerEvent.payload]) body = labels[partnerEvent.type][partnerEvent.payload]
      }
    } catch { /* The generic notification still reaches the user. */ }
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    windows.forEach((client) => client.postMessage({ kind: 'partner-event' }))
    const vibrationEnabled = await readPreference('vibrationEnabled', true)
    await self.registration.showNotification('Мы рядом', { body, icon: '/icons/app-logo.png', badge: '/icons/app-logo.png', tag: notificationTag, ...(vibrationEnabled ? { vibrate: [100, 60, 100] } : {}), data: { url: '/' } })
  })())
})

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    const device = await readDevice()
    if (!device) return
    const keyResponse = await fetch('/api/push/public-key')
    if (!keyResponse.ok) return
    const { publicKey } = await keyResponse.json()
    const subscription = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) })
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-device-id': device.id, 'x-device-secret': device.secret },
      body: JSON.stringify({ endpoint: subscription.endpoint, oldEndpoint: event.oldSubscription?.endpoint }),
    })
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows[0]
    if (existing) { await existing.focus(); existing.postMessage({ kind: 'partner-event' }); return }
    await self.clients.openWindow(event.notification.data?.url || '/')
  })())
})

function readDevice() {
  return new Promise((resolve) => {
    const open = indexedDB.open('my-ryadom-push', 2)
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains('kv')) open.result.createObjectStore('kv')
      if (!open.result.objectStoreNames.contains('seen-events')) open.result.createObjectStore('seen-events')
    }
    open.onerror = () => resolve(null)
    open.onsuccess = () => {
      const request = open.result.transaction('kv').objectStore('kv').get('device')
      request.onsuccess = () => { open.result.close(); resolve(request.result || null) }
      request.onerror = () => { open.result.close(); resolve(null) }
    }
  })
}

function wasEventShown(eventId) {
  return new Promise((resolve) => {
    const open = indexedDB.open('my-ryadom-push', 2)
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains('kv')) open.result.createObjectStore('kv')
      if (!open.result.objectStoreNames.contains('seen-events')) open.result.createObjectStore('seen-events')
    }
    open.onerror = () => resolve(false)
    open.onsuccess = () => {
      const transaction = open.result.transaction('seen-events', 'readwrite')
      const store = transaction.objectStore('seen-events')
      const request = store.get(eventId)
      request.onsuccess = () => {
        const seen = Boolean(request.result)
        if (!seen) store.put(Date.now(), eventId)
        transaction.oncomplete = () => { open.result.close(); resolve(seen) }
      }
      request.onerror = () => { open.result.close(); resolve(false) }
    }
  })
}

function writePreference(key, value) {
  return new Promise((resolve) => {
    const open = indexedDB.open('my-ryadom-push', 2)
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains('kv')) open.result.createObjectStore('kv')
      if (!open.result.objectStoreNames.contains('seen-events')) open.result.createObjectStore('seen-events')
    }
    open.onerror = () => resolve()
    open.onsuccess = () => {
      const transaction = open.result.transaction('kv', 'readwrite')
      transaction.objectStore('kv').put(value, key)
      transaction.oncomplete = () => { open.result.close(); resolve() }
      transaction.onerror = () => { open.result.close(); resolve() }
    }
  })
}

function readPreference(key, fallback) {
  return new Promise((resolve) => {
    const open = indexedDB.open('my-ryadom-push', 2)
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains('kv')) open.result.createObjectStore('kv')
      if (!open.result.objectStoreNames.contains('seen-events')) open.result.createObjectStore('seen-events')
    }
    open.onerror = () => resolve(fallback)
    open.onsuccess = () => {
      const request = open.result.transaction('kv').objectStore('kv').get(key)
      request.onsuccess = () => { open.result.close(); resolve(typeof request.result === 'boolean' ? request.result : fallback) }
      request.onerror = () => { open.result.close(); resolve(fallback) }
    }
  })
}

function decodeKey(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}
