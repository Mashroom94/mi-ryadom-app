import { describe, expect, it } from 'vitest'
import { chatGPTSignInPath, isChatGPTAuthReturn, normalizeRememberedEmail, resolveInitialAccountMode } from './rememberedLogin'

describe('remembered login', () => {
  it('opens password reset first when a reset token is present', () => {
    expect(resolveInitialAccountMode('token', 'maria@example.com')).toBe('reset')
  })

  it('opens sign in and prefills a remembered email', () => {
    expect(resolveInitialAccountMode('', 'maria@example.com')).toBe('login')
    expect(normalizeRememberedEmail('  Maria@Example.COM ')).toBe('maria@example.com')
  })

  it('opens registration for a new user', () => {
    expect(resolveInitialAccountMode('', '')).toBe('register')
  })

  it('creates a safe top-level Sites sign-in return path', () => {
    expect(chatGPTSignInPath()).toBe('/signin-with-chatgpt?return_to=%2F%3Fauth%3Dchatgpt')
    expect(isChatGPTAuthReturn('?auth=chatgpt')).toBe(true)
    expect(isChatGPTAuthReturn('?auth=other')).toBe(false)
  })
})
