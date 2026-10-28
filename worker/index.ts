interface Env {
  DB: D1Database
  ASSETS: { fetch(request: Request): Promise<Response> }
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_JWK: string
  RESEND_API_KEY?: string
  AUTH_FROM_EMAIL?: string
}

interface DeviceRow { id: string; name: string; pair_id: string | null; last_seen: number; user_id: string | null; revoked_at: number | null }

const PAIR_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const MAX_DISPLAY_NAME_LENGTH = 18
export function createPairCodeValue(values = crypto.getRandomValues(new Uint32Array(8))) {
  return Array.from(values, (value) => PAIR_CODE_ALPHABET[value % PAIR_CODE_ALPHABET.length]).join('')
}
interface EventRow { id: string; type: string; payload: string; created_at: number }

export const PASSWORD_HASH_ITERATIONS = 100_000

export function shouldServeAppShell(request: Request, response: Response) {
  const acceptsHtml = request.headers.get('accept')?.includes('text/html') ?? false
  return (request.method === 'GET' || request.method === 'HEAD') && response.status === 404 && acceptsHtml
}

export function appShellUrl(request: Request) {
  return new URL('/', request.url)
}

async function serveAsset(request: Request, env: Env) {
  const response = await env.ASSETS.fetch(request)
  if (!shouldServeAppShell(request, response)) return response

  return env.ASSETS.fetch(new Request(appShellUrl(request), request))
}

export function normalizePushEndpoint(endpoint: string) {
  if (!endpoint.startsWith('https://') || endpoint.length > 2048) throw new Response('Некорректная подписка', { status: 400 })
  return endpoint
}

export function normalizeAccountEmail(email: string) {
  const value = email.trim().toLowerCase()
  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Response('Проверьте адрес почты', { status: 400 })
  return value
}

export function validateAccountPassword(password: string) {
  if (password.length < 8 || password.length > 128) throw new Response('Пароль должен содержать от 8 до 128 символов', { status: 400 })
  return password
}

export function authenticatedSiteUser(request: Request) {
  const id = request.headers.get('oai-authenticated-user-id')?.trim() || ''
  const rawEmail = request.headers.get('oai-authenticated-user-email')?.trim() || ''
  if (!id || !rawEmail) return null
  const email = normalizeAccountEmail(rawEmail)
  const encodedName = request.headers.get('oai-authenticated-user-full-name') || ''
  let name = email.split('@')[0]
  if (encodedName && request.headers.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8') {
    try { name = decodeURIComponent(encodedName).trim() || name } catch { /* Fall back to email name. */ }
  }
  return { id, email, name: Array.from(name).slice(0, MAX_DISPLAY_NAME_LENGTH).join('') }
}

function normalizePushChange(endpoint: string, oldEndpoint?: string | null) {
  return { endpoint: normalizePushEndpoint(endpoint), oldEndpoint: oldEndpoint?.startsWith('https://') && oldEndpoint.length <= 2048 ? oldEndpoint : undefined }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
})

const encode = (value: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value instanceof Uint8Array ? value : new Uint8Array(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function hashSecret(secret: string) {
  return encode(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)))
}

async function hashPassword(password: string, salt = encode(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(validateAccountPassword(password)), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: PASSWORD_HASH_ITERATIONS }, key, 256)
  return { hash: encode(bits), salt }
}

async function passwordMatches(password: string, salt: string, expected: string) {
  try { return (await hashPassword(password, salt)).hash === expected } catch { return false }
}

async function attachDevice(env: Env, user: { id: string; pair_id: string | null; name: string }, id: string, secret: string) {
  if (!id || id.length > 80 || secret.length < 24) throw new Response('Некорректное устройство', { status: 400 })
  const secretHash = await hashSecret(secret)
  const existing = await env.DB.prepare('SELECT secret_hash FROM devices WHERE id = ?').bind(id).first<{ secret_hash: string }>()
  if (existing && existing.secret_hash !== secretHash) throw new Response('Устройство уже зарегистрировано', { status: 409 })
  const now = Date.now()
  await env.DB.prepare('INSERT INTO devices (id, secret_hash, name, pair_id, last_seen, user_id, revoked_at) VALUES (?, ?, ?, ?, ?, ?, NULL) ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, pair_id = excluded.pair_id, name = excluded.name, last_seen = excluded.last_seen, revoked_at = NULL').bind(id, secretHash, user.name, user.pair_id, now, user.id).run()
  return (await env.DB.prepare('SELECT id, name, pair_id, last_seen, user_id, revoked_at FROM devices WHERE id = ?').bind(id).first<DeviceRow>())!
}

async function sendPasswordReset(email: string, token: string, request: Request, env: Env) {
  if (!env.RESEND_API_KEY || !env.AUTH_FROM_EMAIL) throw new Response('Восстановление по почте скоро будет доступно. Администратору нужно подключить почтовый сервис.', { status: 503 })
  const resetUrl = `${new URL(request.url).origin}/?reset=${encodeURIComponent(token)}`
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.AUTH_FROM_EMAIL, to: [email], subject: 'Восстановление доступа к «Мы рядом»', html: `<p>Чтобы задать новый пароль, откройте ссылку:</p><p><a href="${resetUrl}">Восстановить доступ</a></p><p>Ссылка действует 30 минут.</p>` }),
  })
  if (!response.ok) throw new Response('Не удалось отправить письмо. Попробуйте позже.', { status: 502 })
}

async function readBody<T>(request: Request): Promise<T> {
  try { return await request.json<T>() } catch { throw new Response('Некорректные данные', { status: 400 }) }
}

async function authenticate(request: Request, env: Env): Promise<DeviceRow> {
  const id = request.headers.get('x-device-id') || ''
  const secret = request.headers.get('x-device-secret') || ''
  if (!id || !secret) throw new Response('Требуется авторизация устройства', { status: 401 })
  const device = await env.DB.prepare('SELECT id, name, pair_id, last_seen, user_id, revoked_at FROM devices WHERE id = ? AND secret_hash = ? AND revoked_at IS NULL').bind(id, await hashSecret(secret)).first<DeviceRow>()
  if (!device) throw new Response('Устройство не найдено', { status: 401 })
  return device
}

const ownerId = (device: DeviceRow) => device.user_id || device.id

async function partnerStatus(device: DeviceRow, env: Env) {
  const user = await env.DB.prepare('SELECT pair_id FROM users WHERE id = ?').bind(ownerId(device)).first<{ pair_id: string | null }>()
  if (!user?.pair_id) return { paired: false, partnerName: null, partnerOnline: false }
  const partner = await env.DB.prepare('SELECT id, name FROM users WHERE pair_id = ? AND id != ? LIMIT 1').bind(user.pair_id, ownerId(device)).first<{ id: string; name: string }>()
  const presence = partner ? await env.DB.prepare('SELECT MAX(last_seen) AS last_seen FROM devices WHERE user_id = ? AND revoked_at IS NULL').bind(partner.id).first<{ last_seen: number | null }>() : null
  return partner
    ? { paired: true, partnerName: partner.name, partnerOnline: Date.now() - (presence?.last_seen ?? 0) < 45_000 }
    : { paired: false, partnerName: null, partnerOnline: false }
}

async function sendPush(endpoint: string, env: Env) {
  const url = new URL(endpoint)
  const issued = Math.floor(Date.now() / 1000)
  const header = encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const claims = encode(JSON.stringify({ aud: url.origin, exp: issued + 12 * 60 * 60, sub: 'mailto:noreply@my-ryadom.app' }))
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.VAPID_PRIVATE_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${header}.${claims}`))
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `vapid t=${header}.${claims}.${encode(signature)}, k=${env.VAPID_PUBLIC_KEY}`,
      ttl: '300',
      urgency: 'normal',
      'content-length': '0',
    },
  })
}

async function routeApi(request: Request, env: Env, pathname: string) {
  if (pathname === '/api/push/public-key' && request.method === 'GET') return json({ publicKey: env.VAPID_PUBLIC_KEY })

  if (pathname === '/api/device/register' && request.method === 'POST') {
    const body = await readBody<{ id?: string; secret?: string; name?: string }>(request)
    if (!body.id || !body.secret || body.id.length > 80 || body.secret.length < 24) return json({ error: 'Некорректное устройство' }, 400)
    const hash = await hashSecret(body.secret)
    const existing = await env.DB.prepare('SELECT secret_hash FROM devices WHERE id = ?').bind(body.id).first<{ secret_hash: string }>()
    if (existing && existing.secret_hash !== hash) return json({ error: 'Устройство уже зарегистрировано' }, 409)
    const name = Array.from((body.name || 'Любимый человек').trim()).slice(0, MAX_DISPLAY_NAME_LENGTH).join('')
    const now = Date.now()
    await env.DB.batch([
      env.DB.prepare('INSERT OR IGNORE INTO users (id, recovery_hash, pair_id, name, created_at, updated_at) VALUES (?, NULL, NULL, ?, ?, ?)').bind(body.id, name, now, now),
      env.DB.prepare('INSERT OR IGNORE INTO devices (id, secret_hash, name, pair_id, last_seen, user_id, revoked_at) VALUES (?, ?, ?, NULL, ?, ?, NULL)').bind(body.id, hash, name, now, body.id),
      env.DB.prepare('UPDATE devices SET name = ?, last_seen = ? WHERE id = ? AND revoked_at IS NULL').bind(name, now, body.id),
    ])
    const device = await env.DB.prepare('SELECT id, name, pair_id, last_seen, user_id, revoked_at FROM devices WHERE id = ?').bind(body.id).first<DeviceRow>()
    if (device) await env.DB.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').bind(name, now, ownerId(device)).run()
    return json({ available: true, ...(await partnerStatus(device!, env)) })
  }

  if (pathname === '/api/account/login' && request.method === 'POST') {
    const body = await readBody<{ id?: string; secret?: string; email?: string; password?: string }>(request)
    const email = normalizeAccountEmail(body.email || '')
    const user = await env.DB.prepare('SELECT id, pair_id, name, password_hash, password_salt FROM users WHERE email = ?').bind(email).first<{ id: string; pair_id: string | null; name: string; password_hash: string | null; password_salt: string | null }>()
    if (!user?.password_hash || !user.password_salt || !await passwordMatches(body.password || '', user.password_salt, user.password_hash)) return json({ error: 'Неверная почта или пароль' }, 401)
    const device = await attachDevice(env, user, body.id || '', body.secret || '')
    return json({ available: true, name: user.name, ...(await partnerStatus(device, env)) })
  }

  if (pathname === '/api/account/site-login' && request.method === 'POST') {
    const identity = authenticatedSiteUser(request)
    if (!identity) return json({ error: 'Сначала войдите через Google или ChatGPT' }, 401)
    const currentDevice = await authenticate(request, env)
    let user = await env.DB.prepare('SELECT id, pair_id, name FROM users WHERE email = ?').bind(identity.email).first<{ id: string; pair_id: string | null; name: string }>()
    let created = false
    if (!user) {
      const currentOwnerId = ownerId(currentDevice)
      try {
        await env.DB.batch([
          env.DB.prepare('UPDATE users SET email = ?, name = ?, updated_at = ? WHERE id = ?').bind(identity.email, identity.name, Date.now(), currentOwnerId),
          env.DB.prepare('UPDATE devices SET name = ? WHERE user_id = ?').bind(identity.name, currentOwnerId),
        ])
        user = await env.DB.prepare('SELECT id, pair_id, name FROM users WHERE id = ?').bind(currentOwnerId).first<{ id: string; pair_id: string | null; name: string }>()
        created = true
      } catch {
        user = await env.DB.prepare('SELECT id, pair_id, name FROM users WHERE email = ?').bind(identity.email).first<{ id: string; pair_id: string | null; name: string }>()
      }
    }
    if (!user) return json({ error: 'Не удалось войти в аккаунт' }, 500)
    const device = await attachDevice(env, user, request.headers.get('x-device-id') || '', request.headers.get('x-device-secret') || '')
    return json({ available: true, created, name: user.name, email: identity.email, ...(await partnerStatus(device, env)) })
  }

  if (pathname === '/api/account/reset/request' && request.method === 'POST') {
    const body = await readBody<{ email?: string }>(request)
    const email = normalizeAccountEmail(body.email || '')
    if (!env.RESEND_API_KEY || !env.AUTH_FROM_EMAIL) return json({ error: 'Восстановление по почте скоро будет доступно. Нужно подключить почтовый сервис.' }, 503)
    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND password_hash IS NOT NULL').bind(email).first<{ id: string }>()
    if (user) {
      const token = encode(crypto.getRandomValues(new Uint8Array(32)))
      await env.DB.prepare('UPDATE users SET reset_token_hash = ?, reset_expires_at = ?, updated_at = ? WHERE id = ?').bind(await hashSecret(token), Date.now() + 30 * 60_000, Date.now(), user.id).run()
      await sendPasswordReset(email, token, request, env)
    }
    return json({ sent: true })
  }

  if (pathname === '/api/account/reset/confirm' && request.method === 'POST') {
    const body = await readBody<{ id?: string; secret?: string; token?: string; password?: string }>(request)
    const tokenHash = await hashSecret(body.token || '')
    const user = await env.DB.prepare('SELECT id, pair_id, name FROM users WHERE reset_token_hash = ? AND reset_expires_at > ?').bind(tokenHash, Date.now()).first<{ id: string; pair_id: string | null; name: string }>()
    if (!user) return json({ error: 'Ссылка недействительна или уже истекла' }, 400)
    const password = await hashPassword(body.password || '')
    await env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ?, reset_token_hash = NULL, reset_expires_at = NULL, updated_at = ? WHERE id = ?').bind(password.hash, password.salt, Date.now(), user.id).run()
    const device = await attachDevice(env, user, body.id || '', body.secret || '')
    return json({ available: true, name: user.name, ...(await partnerStatus(device, env)) })
  }

  if (pathname === '/api/recovery/restore' && request.method === 'POST') {
    const body = await readBody<{ id?: string; secret?: string; recoveryKey?: string; name?: string }>(request)
    const recoveryKey = body.recoveryKey?.trim() || ''
    if (!body.id || !body.secret || body.secret.length < 24 || !/^[A-Za-z0-9_-]{43,64}$/.test(recoveryKey)) return json({ error: 'Некорректные данные восстановления' }, 400)
    const recoveryHash = await hashSecret(recoveryKey)
    const user = await env.DB.prepare('SELECT id, pair_id, name FROM users WHERE recovery_hash = ?').bind(recoveryHash).first<{ id: string; pair_id: string | null; name: string }>()
    if (!user) return json({ error: 'Ключ восстановления не найден' }, 404)
    const existing = await env.DB.prepare('SELECT secret_hash FROM devices WHERE id = ?').bind(body.id).first<{ secret_hash: string }>()
    const secretHash = await hashSecret(body.secret)
    if (existing && existing.secret_hash !== secretHash) return json({ error: 'Устройство уже зарегистрировано' }, 409)
    const now = Date.now()
    await env.DB.prepare('INSERT INTO devices (id, secret_hash, name, pair_id, last_seen, user_id, revoked_at) VALUES (?, ?, ?, ?, ?, ?, NULL) ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, pair_id = excluded.pair_id, name = excluded.name, last_seen = excluded.last_seen, revoked_at = NULL').bind(body.id, secretHash, Array.from((body.name || user.name).trim()).slice(0, MAX_DISPLAY_NAME_LENGTH).join(''), user.pair_id, now, user.id).run()
    const restored = await env.DB.prepare('SELECT id, name, pair_id, last_seen, user_id, revoked_at FROM devices WHERE id = ?').bind(body.id).first<DeviceRow>()
    return json({ available: true, restored: true, ...(await partnerStatus(restored!, env)) })
  }

  const device = await authenticate(request, env)
  if (pathname === '/api/device/heartbeat' && request.method === 'POST') return json({ available: true, ...(await partnerStatus(device, env)) })
  if (pathname === '/api/pair/status' && request.method === 'GET') return json({ available: true, ...(await partnerStatus(device, env)) })

  if (pathname === '/api/account/status' && request.method === 'GET') {
    const account = await env.DB.prepare('SELECT email, password_hash FROM users WHERE id = ?').bind(ownerId(device)).first<{ email: string | null; password_hash: string | null }>()
    return json({ configured: Boolean(account?.email && account.password_hash), email: account?.email ?? null })
  }

  if (pathname === '/api/account/password' && request.method === 'PUT') {
    const body = await readBody<{ email?: string; password?: string; currentPassword?: string; name?: string }>(request)
    const email = normalizeAccountEmail(body.email || '')
    const account = await env.DB.prepare('SELECT password_hash, password_salt FROM users WHERE id = ?').bind(ownerId(device)).first<{ password_hash: string | null; password_salt: string | null }>()
    if (account?.password_hash && account.password_salt && !await passwordMatches(body.currentPassword || '', account.password_salt, account.password_hash)) return json({ error: 'Текущий пароль введён неверно' }, 401)
    const password = await hashPassword(body.password || '')
    const name = Array.from((body.name || device.name).trim()).slice(0, MAX_DISPLAY_NAME_LENGTH).join('') || device.name
    try {
      await env.DB.batch([
        env.DB.prepare('UPDATE users SET email = ?, password_hash = ?, password_salt = ?, name = ?, recovery_hash = NULL, updated_at = ? WHERE id = ?').bind(email, password.hash, password.salt, name, Date.now(), ownerId(device)),
        env.DB.prepare('UPDATE devices SET name = ? WHERE user_id = ?').bind(name, ownerId(device)),
      ])
    } catch { return json({ error: 'Эта почта уже используется' }, 409) }
    return json({ configured: true, email, name })
  }

  if (pathname === '/api/sync' && request.method === 'PUT') {
    const body = await readBody<{ state?: unknown }>(request)
    const payload = JSON.stringify(body.state ?? {})
    if (payload.length > 900_000) return json({ error: 'Слишком много данных для синхронизации' }, 413)
    await env.DB.prepare('INSERT INTO shared_state (device_id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(device_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at').bind(ownerId(device), payload, Date.now()).run()
    return json({ synced: true })
  }

  if (pathname === '/api/sync/self' && request.method === 'GET') {
    const row = await env.DB.prepare('SELECT payload, updated_at FROM shared_state WHERE device_id = ?').bind(ownerId(device)).first<{ payload: string; updated_at: number }>()
    let state: unknown = null
    try { state = row ? JSON.parse(row.payload) : null } catch { state = null }
    return json({ state, updatedAt: row?.updated_at ?? null })
  }

  if (pathname === '/api/sync' && request.method === 'GET') {
    const currentUser = await env.DB.prepare('SELECT pair_id FROM users WHERE id = ?').bind(ownerId(device)).first<{ pair_id: string | null }>()
    const partner = currentUser?.pair_id ? await env.DB.prepare('SELECT id FROM users WHERE pair_id = ? AND id != ? LIMIT 1').bind(currentUser.pair_id, ownerId(device)).first<{ id: string }>() : null
    const row = partner ? await env.DB.prepare('SELECT payload, updated_at FROM shared_state WHERE device_id = ?').bind(partner.id).first<{ payload: string; updated_at: number }>() : null
    let partnerState: unknown = null
    try { partnerState = row ? JSON.parse(row.payload) : null } catch { partnerState = null }
    return json({ partnerState, updatedAt: row?.updated_at ?? null })
  }

  if (pathname === '/api/pair/code' && request.method === 'POST') {
    const existing = await env.DB.prepare('SELECT code, expires_at FROM pair_codes WHERE device_id = ? AND expires_at > ? ORDER BY expires_at DESC LIMIT 1').bind(device.id, Date.now()).first<{ code: string; expires_at: number }>()
    if (existing) return json({ code: existing.code, expiresAt: existing.expires_at })
    const code = createPairCodeValue()
    const expiresAt = Date.now() + 365 * 24 * 60 * 60_000
    await env.DB.batch([
      env.DB.prepare('DELETE FROM pair_codes WHERE device_id = ? OR expires_at < ?').bind(device.id, Date.now()),
      env.DB.prepare('INSERT INTO pair_codes (code, device_id, expires_at) VALUES (?, ?, ?)').bind(code, device.id, expiresAt),
    ])
    return json({ code, expiresAt })
  }

  if (pathname === '/api/pair/join' && request.method === 'POST') {
    const body = await readBody<{ code?: string }>(request)
    const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    const owner = await env.DB.prepare('SELECT device_id FROM pair_codes WHERE code = ? AND expires_at > ?').bind(code, Date.now()).first<{ device_id: string }>()
    if (!owner || owner.device_id === device.id) return json({ error: 'Код не найден или уже истёк' }, 404)
    const ownerDevice = await env.DB.prepare('SELECT id, name, pair_id, last_seen, user_id, revoked_at FROM devices WHERE id = ?').bind(owner.device_id).first<DeviceRow>()
    if (!ownerDevice || ownerId(ownerDevice) === ownerId(device)) return json({ error: 'Нельзя связать пользователя с самим собой' }, 400)
    const pairId = crypto.randomUUID()
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET pair_id = ?, updated_at = ? WHERE id IN (?, ?)').bind(pairId, Date.now(), ownerId(ownerDevice), ownerId(device)),
      env.DB.prepare('UPDATE devices SET pair_id = ? WHERE user_id IN (?, ?)').bind(pairId, ownerId(ownerDevice), ownerId(device)),
    ])
    const refreshed = { ...device, pair_id: pairId }
    return json({ available: true, ...(await partnerStatus(refreshed, env)) })
  }

  if (pathname === '/api/pair/unlink' && request.method === 'DELETE') {
    const current = await env.DB.prepare('SELECT pair_id FROM users WHERE id = ?').bind(ownerId(device)).first<{ pair_id: string | null }>()
    if (current?.pair_id) {
      await env.DB.batch([
        env.DB.prepare('UPDATE users SET pair_id = NULL, updated_at = ? WHERE pair_id = ?').bind(Date.now(), current.pair_id),
        env.DB.prepare('UPDATE devices SET pair_id = NULL WHERE pair_id = ?').bind(current.pair_id),
      ])
    }
    return json({ available: true, paired: false, partnerName: null, partnerOnline: false })
  }

  if (pathname === '/api/recovery/create' && request.method === 'POST') {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    const recoveryKey = encode(bytes)
    await env.DB.prepare('UPDATE users SET recovery_hash = ?, updated_at = ? WHERE id = ?').bind(await hashSecret(recoveryKey), Date.now(), ownerId(device)).run()
    return json({ recoveryKey })
  }

  if (pathname === '/api/devices' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT id, name, last_seen, revoked_at FROM devices WHERE user_id = ? ORDER BY last_seen DESC').bind(ownerId(device)).all<{ id: string; name: string; last_seen: number; revoked_at: number | null }>()
    return json({ devices: result.results.map((item) => ({ id: item.id, name: item.name, lastSeen: item.last_seen, revoked: item.revoked_at !== null, current: item.id === device.id })) })
  }

  if (pathname.startsWith('/api/devices/') && request.method === 'DELETE') {
    const targetId = decodeURIComponent(pathname.slice('/api/devices/'.length))
    if (!targetId || targetId === device.id) return json({ error: 'Нельзя отозвать текущее устройство' }, 400)
    await env.DB.batch([
      env.DB.prepare('UPDATE devices SET revoked_at = ? WHERE id = ? AND user_id = ?').bind(Date.now(), targetId, ownerId(device)),
      env.DB.prepare('DELETE FROM push_subscriptions_v2 WHERE device_id = ?').bind(targetId),
    ])
    return json({ revoked: true })
  }

  if (pathname === '/api/push/subscribe' && request.method === 'POST') {
    const body = await readBody<{ endpoint?: string; oldEndpoint?: string }>(request)
    if (!body.endpoint) return json({ error: 'Некорректная подписка' }, 400)
    const subscription = normalizePushChange(body.endpoint, body.oldEndpoint)
    const now = Date.now()
    const statements = [
      env.DB.prepare('INSERT INTO push_subscriptions_v2 (id, device_id, endpoint, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET device_id = excluded.device_id, updated_at = excluded.updated_at').bind(crypto.randomUUID(), device.id, subscription.endpoint, now, now),
    ]
    if (subscription.oldEndpoint && subscription.oldEndpoint !== subscription.endpoint) statements.push(env.DB.prepare('DELETE FROM push_subscriptions_v2 WHERE endpoint = ? AND device_id = ?').bind(subscription.oldEndpoint, device.id))
    await env.DB.batch(statements)
    return json({ subscribed: true })
  }

  if (pathname === '/api/push/subscribe' && request.method === 'DELETE') {
    const body = await readBody<{ endpoint?: string }>(request)
    const endpoint = normalizePushEndpoint(body.endpoint || '')
    await env.DB.prepare('DELETE FROM push_subscriptions_v2 WHERE endpoint = ? AND device_id = ?').bind(endpoint, device.id).run()
    return json({ subscribed: false })
  }

  if (pathname === '/api/events' && request.method === 'POST') {
    const body = await readBody<{ id?: string; type?: string; payload?: string; state?: unknown }>(request)
    const allowed = new Set(['sign', 'sticker', 'touch', 'mood', 'wishlist', 'idea', 'customization', 'notes'])
    if (!body.type || !allowed.has(body.type) || typeof body.payload !== 'string' || body.payload.length > 120) return json({ error: 'Некорректное действие' }, 400)
    if (body.state !== undefined) {
      const statePayload = JSON.stringify(body.state)
      if (statePayload.length > 900_000) return json({ error: 'Снимок настроек слишком большой' }, 413)
      await env.DB.prepare('INSERT INTO shared_state (device_id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(device_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at').bind(ownerId(device), statePayload, Date.now()).run()
    }
    const currentUser = await env.DB.prepare('SELECT pair_id FROM users WHERE id = ?').bind(ownerId(device)).first<{ pair_id: string | null }>()
    const partner = currentUser?.pair_id ? await env.DB.prepare('SELECT id FROM users WHERE pair_id = ? AND id != ? LIMIT 1').bind(currentUser.pair_id, ownerId(device)).first<{ id: string }>() : null
    if (!partner) return json({ deliveredToPartner: false, notificationQueued: false })
    if (body.type === 'touch') {
      const duplicate = await env.DB.prepare('SELECT id FROM partner_events WHERE sender_device_id = ? AND receiver_device_id = ? AND type = ? AND created_at >= ? LIMIT 1').bind(ownerId(device), partner.id, 'touch', Date.now() - 10_000).first<{ id: string }>()
      if (duplicate) return json({ deliveredToPartner: true, notificationQueued: false, deduplicated: true })
    }
    const eventId = body.id?.slice(0, 80) || crypto.randomUUID()
    const inserted = await env.DB.prepare('INSERT OR IGNORE INTO partner_events (id, sender_device_id, receiver_device_id, type, payload, created_at, delivered) VALUES (?, ?, ?, ?, ?, ?, 0)').bind(eventId, ownerId(device), partner.id, body.type, body.payload, Date.now()).run()
    const subscriptions = await env.DB.prepare('SELECT ps.endpoint FROM push_subscriptions_v2 ps JOIN devices d ON d.id = ps.device_id WHERE d.user_id = ? AND d.revoked_at IS NULL ORDER BY ps.updated_at DESC LIMIT 8').bind(partner.id).all<{ endpoint: string }>()
    let notificationQueued = false
    for (const subscription of Number(inserted.meta.changes) > 0 ? subscriptions.results : []) {
      try {
        const response = await sendPush(subscription.endpoint, env)
        notificationQueued = response.ok || notificationQueued
        if (response.status === 404 || response.status === 410) await env.DB.prepare('DELETE FROM push_subscriptions_v2 WHERE endpoint = ?').bind(subscription.endpoint).run()
      } catch { /* Another active subscription may still have succeeded. */ }
    }
    return json({ deliveredToPartner: true, notificationQueued })
  }

  if (pathname === '/api/events/latest' && request.method === 'POST') {
    const event = await env.DB.prepare('SELECT pe.id, pe.type, pe.payload, pe.created_at FROM partner_events pe WHERE pe.receiver_device_id = ? AND pe.delivered = 0 AND NOT EXISTS (SELECT 1 FROM event_notification_claims enc WHERE enc.event_id = pe.id AND enc.device_id = ?) ORDER BY pe.created_at ASC LIMIT 1').bind(ownerId(device), device.id).first<EventRow>()
    if (event) await env.DB.prepare('INSERT OR IGNORE INTO event_notification_claims (event_id, device_id, notified_at) VALUES (?, ?, ?)').bind(event.id, device.id, Date.now()).run()
    return json({ event: event ? { id: event.id, type: event.type, payload: event.payload, createdAt: new Date(event.created_at).toISOString(), delivery: 'remote', direction: 'received' } : null })
  }

  if (pathname === '/api/events/poll' && request.method === 'POST') {
    const result = await env.DB.prepare('SELECT id, type, payload, created_at FROM partner_events WHERE receiver_device_id = ? AND delivered = 0 ORDER BY created_at ASC LIMIT 20').bind(ownerId(device)).all<EventRow>()
    const events = result.results.map((row) => ({ id: row.id, type: row.type, payload: row.payload, createdAt: new Date(row.created_at).toISOString(), delivery: 'remote', direction: 'received' }))
    if (events.length) {
      const placeholders = events.map(() => '?').join(',')
      await env.DB.prepare(`UPDATE partner_events SET delivered = 1 WHERE receiver_device_id = ? AND id IN (${placeholders})`).bind(ownerId(device), ...events.map((event) => event.id)).run()
    }
    const deliveredBefore = Date.now() - 7 * 24 * 60 * 60_000
    await env.DB.prepare('DELETE FROM event_notification_claims WHERE event_id IN (SELECT id FROM partner_events WHERE receiver_device_id = ? AND delivered = 1 AND created_at < ?)').bind(ownerId(device), deliveredBefore).run()
    await env.DB.prepare('DELETE FROM partner_events WHERE receiver_device_id = ? AND delivered = 1 AND created_at < ?').bind(ownerId(device), deliveredBefore).run()
    return json({ events })
  }

  return json({ error: 'Маршрут не найден' }, 404)
}

export default {
  async fetch(request: Request, env: Env) {
    const pathname = new URL(request.url).pathname
    if (!pathname.startsWith('/api/')) return serveAsset(request, env)
    try { return await routeApi(request, env, pathname) }
    catch (error) {
      if (error instanceof Response) return error
      console.error(error)
      return json({ error: 'Временная ошибка сервера' }, 500)
    }
  },
}
