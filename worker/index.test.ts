import { describe, expect, it } from 'vitest'
import { appShellUrl, authenticatedSiteUser, createPairCodeValue, normalizeAccountEmail, normalizePushEndpoint, PASSWORD_HASH_ITERATIONS, shouldServeAppShell, validateAccountPassword } from './index'

describe('shouldServeAppShell', () => {
  it('falls back to the app shell for missing document routes', () => {
    const request = new Request('https://example.com/notes', {
      headers: { accept: 'text/html,application/xhtml+xml' },
    })

    expect(shouldServeAppShell(request, new Response(null, { status: 404 }))).toBe(true)
  })

  it('keeps real responses and missing assets unchanged', () => {
    const documentRequest = new Request('https://example.com/notes', {
      headers: { accept: 'text/html' },
    })
    const assetRequest = new Request('https://example.com/missing.png', {
      headers: { accept: 'image/avif,image/webp' },
    })

    expect(shouldServeAppShell(documentRequest, new Response('ok'))).toBe(false)
    expect(shouldServeAppShell(assetRequest, new Response(null, { status: 404 }))).toBe(false)
  })

  it('loads the canonical root shell without redirecting through index.html', () => {
    const request = new Request('https://example.com/notes?from=link')

    expect(appShellUrl(request).href).toBe('https://example.com/')
  })
})

describe('normalizePushEndpoint', () => {
  it('accepts a secure push endpoint and rejects an insecure one', () => {
    expect(normalizePushEndpoint('https://push.example/subscription')).toBe('https://push.example/subscription')
    expect(() => normalizePushEndpoint('http://push.example/subscription')).toThrow()
  })
})

describe('pair code generation', () => {
  it('creates a reusable high-entropy eight-character code', () => {
    expect(createPairCodeValue(new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7]))).toBe('23456789')
  })
})

describe('account credentials', () => {
  it('normalizes a valid email and rejects malformed addresses', () => {
    expect(normalizeAccountEmail(' Maria@Example.COM ')).toBe('maria@example.com')
    expect(() => normalizeAccountEmail('not-an-email')).toThrow()
  })

  it('requires a practical password length', () => {
    expect(validateAccountPassword('длинный пароль 2026')).toBe('длинный пароль 2026')
    expect(() => validateAccountPassword('12345')).toThrow()
  })

  it('uses a PBKDF2 cost supported by the production Worker runtime', () => {
    expect(PASSWORD_HASH_ITERATIONS).toBe(100_000)
  })

  it('reads verified Sites identity headers for one-click sign in', () => {
    const request = new Request('https://example.com/api/account/site-login', { headers: {
      'oai-authenticated-user-id': 'user-1',
      'oai-authenticated-user-email': 'Maria@Example.com',
      'oai-authenticated-user-full-name': '%D0%9C%D0%B0%D1%80%D0%B8%D1%8F%20%D0%93%D1%80%D0%B8%D0%B1%D0%BE%D0%B2%D0%B0',
      'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
    } })

    expect(authenticatedSiteUser(request)).toEqual({ id: 'user-1', email: 'maria@example.com', name: 'Мария Грибова' })
  })
})
