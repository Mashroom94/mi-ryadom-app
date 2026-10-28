import type { PartnerEvent, SharedProfile } from '../models/types'
import { createEventEnvelope } from './eventEnvelope'
import { currentNotificationSupport } from './notificationSupport'
import { normalizePairCode } from './pairCode'

const STORAGE_KEY = 'my-ryadom:device-v1'
const DB_NAME = 'my-ryadom-push'

interface Credentials { id: string; secret: string }
export interface PairStatus { available: boolean; paired: boolean; partnerName: string | null; partnerOnline: boolean }
export interface UserDevice { id: string; name: string; lastSeen: number; revoked: boolean; current: boolean }
export interface AccountStatus { configured: boolean; email: string | null }
export interface SiteLoginResult extends PairStatus { created: boolean; name: string; email: string }

function credentials(): Credentials {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try { return JSON.parse(saved) as Credentials } catch { /* recreate below */ }
  }
  const value = { id: crypto.randomUUID(), secret: crypto.randomUUID() + crypto.randomUUID() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  void saveForServiceWorker(value)
  return value
}

function saveForServiceWorker(value: Credentials) {
  return new Promise<void>((resolve) => {
    const open = indexedDB.open(DB_NAME, 2)
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains('kv')) open.result.createObjectStore('kv')
      if (!open.result.objectStoreNames.contains('seen-events')) open.result.createObjectStore('seen-events')
    }
    open.onerror = () => resolve()
    open.onsuccess = () => {
      const transaction = open.result.transaction('kv', 'readwrite')
      transaction.objectStore('kv').put(value, 'device')
      transaction.oncomplete = () => { open.result.close(); resolve() }
      transaction.onerror = () => { open.result.close(); resolve() }
    }
  })
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = credentials()
  await saveForServiceWorker(auth)
  const response = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-device-id': auth.id, 'x-device-secret': auth.secret, ...init.headers },
  })
  const data = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(data.error || 'Сервис временно недоступен')
  return data
}

export const remotePartnerService = {
  async register(name: string): Promise<PairStatus> {
    const auth = credentials()
    try {
      return await api('/api/device/register', { method: 'POST', body: JSON.stringify({ ...auth, name }) })
    } catch {
      return { available: false, paired: false, partnerName: null, partnerOnline: false }
    }
  },
  heartbeat: () => api<PairStatus>('/api/device/heartbeat', { method: 'POST' }),
  status: () => api<PairStatus>('/api/pair/status'),
  createPairCode: () => api<{ code: string; expiresAt: number }>('/api/pair/code', { method: 'POST' }),
  joinPair: (code: string) => api<PairStatus>('/api/pair/join', { method: 'POST', body: JSON.stringify({ code: normalizePairCode(code) }) }),
  unlinkPair: () => api<PairStatus>('/api/pair/unlink', { method: 'DELETE' }),
  createRecoveryKey: () => api<{ recoveryKey: string }>('/api/recovery/create', { method: 'POST' }),
  accountStatus: () => api<AccountStatus>('/api/account/status'),
  setPassword: (email: string, password: string, currentPassword: string, name: string) => api<AccountStatus & { name: string }>('/api/account/password', { method: 'PUT', body: JSON.stringify({ email, password, currentPassword, name }) }),
  siteLogin: () => api<SiteLoginResult>('/api/account/site-login', { method: 'POST', body: '{}' }),
  requestPasswordReset: (email: string) => api<{ sent: boolean }>('/api/account/reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
  async login(email: string, password: string) {
    const auth = credentials()
    const response = await fetch('/api/account/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...auth, email, password }) })
    const data = await response.json().catch(() => ({})) as PairStatus & { name?: string; error?: string }
    if (!response.ok) throw new Error(data.error || 'Не удалось войти')
    await saveForServiceWorker(auth)
    return data
  },
  async confirmPasswordReset(token: string, password: string) {
    const auth = credentials()
    const response = await fetch('/api/account/reset/confirm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...auth, token, password }) })
    const data = await response.json().catch(() => ({})) as PairStatus & { name?: string; error?: string }
    if (!response.ok) throw new Error(data.error || 'Не удалось задать новый пароль')
    await saveForServiceWorker(auth)
    return data
  },
  listDevices: () => api<{ devices: UserDevice[] }>('/api/devices'),
  revokeDevice: (id: string) => api<{ revoked: boolean }>(`/api/devices/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  async restore(recoveryKey: string, name: string) {
    const auth = credentials()
    const response = await fetch('/api/recovery/restore', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...auth, recoveryKey, name }),
    })
    const data = await response.json().catch(() => ({})) as PairStatus & { error?: string }
    if (!response.ok) throw new Error(data.error || 'Не удалось восстановить аккаунт')
    await saveForServiceWorker(auth)
    return data
  },
  send: (event: PartnerEvent, state?: SharedProfile) => api<{ deliveredToPartner: boolean; notificationQueued: boolean }>('/api/events', { method: 'POST', body: JSON.stringify(createEventEnvelope(event, state)) }),
  async poll() {
    try { return (await api<{ events: PartnerEvent[] }>('/api/events/poll', { method: 'POST' })).events }
    catch { return [] }
  },
  async sync(state: SharedProfile) {
    try { await api('/api/sync', { method: 'PUT', body: JSON.stringify({ state }) }); return true } catch { return false }
  },
  async pullPartnerState() {
    try { return (await api<{ partnerState: SharedProfile | null }>('/api/sync')).partnerState } catch { return null }
  },
  async pullOwnState() {
    try {
      const result = await api<{ state: SharedProfile | null; updatedAt: number | null }>('/api/sync/self')
      return { available: true, ...result }
    } catch {
      return { available: false, state: null, updatedAt: null }
    }
  },
  async enableNotifications() {
    const support = currentNotificationSupport()
    if (support === 'ios-install-required') throw new Error('На iPhone добавьте «Мы рядом» на экран «Домой», откройте приложение с иконки и включите уведомления здесь.')
    if (support === 'unsupported') throw new Error('Уведомления не поддерживаются этим браузером. Обновите систему и браузер.')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') throw new Error('Разрешите уведомления в настройках браузера')
    const registration = await navigator.serviceWorker.ready
    const { publicKey } = await api<{ publicKey: string }>('/api/push/public-key')
    const existing = await registration.pushManager.getSubscription()
    const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) })
    await api('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ endpoint: subscription.endpoint }) })
    return true
  },
  async notificationsEnabled() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    const registration = await navigator.serviceWorker.ready
    return Boolean(await registration.pushManager.getSubscription())
  },
  async disableNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return false
    await api('/api/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) })
    await subscription.unsubscribe()
    return true
  },
}

function decodeKey(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}
