export type AccountMode = 'register' | 'login' | 'forgot' | 'reset'

const REMEMBERED_EMAIL_KEY = 'my-ryadom:remembered-email-v1'

export function chatGPTSignInPath() {
  return `/signin-with-chatgpt?return_to=${encodeURIComponent('/?auth=chatgpt')}`
}

export function isChatGPTAuthReturn(search: string) {
  return new URLSearchParams(search).get('auth') === 'chatgpt'
}

export function normalizeRememberedEmail(value: string) {
  return value.trim().toLowerCase()
}

export function resolveInitialAccountMode(resetToken: string, rememberedEmail: string): AccountMode {
  if (resetToken) return 'reset'
  return normalizeRememberedEmail(rememberedEmail) ? 'login' : 'register'
}

export function readRememberedEmail() {
  try { return normalizeRememberedEmail(localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '') }
  catch { return '' }
}

export function updateRememberedEmail(email: string, remember: boolean) {
  try {
    if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, normalizeRememberedEmail(email))
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY)
  } catch { /* Private browsing can reject storage without breaking sign-in. */ }
}

export async function savePasswordWithBrowser(email: string, password: string, name?: string) {
  const PasswordCredentialConstructor = (globalThis as typeof globalThis & {
    PasswordCredential?: new (data: { id: string; password: string; name?: string }) => Credential
  }).PasswordCredential
  if (!PasswordCredentialConstructor || !navigator.credentials?.store) return
  try {
    await navigator.credentials.store(new PasswordCredentialConstructor({ id: normalizeRememberedEmail(email), password, name }))
  } catch { /* The browser may prefer its native password-save prompt. */ }
}
