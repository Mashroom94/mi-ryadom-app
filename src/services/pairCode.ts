const PAIR_CODE_KEY = 'my-ryadom:last-pair-code-v1'

export function normalizePairCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

export function savePairCode(value: string) {
  const code = normalizePairCode(value)
  if (!code) return
  try { localStorage.setItem(PAIR_CODE_KEY, code) } catch { /* The current session can still use the code. */ }
}

export function readSavedPairCode() {
  try { return normalizePairCode(localStorage.getItem(PAIR_CODE_KEY) ?? '') } catch { return '' }
}

export function isCompletePairCode(value: string) {
  const length = normalizePairCode(value).length
  return length === 6 || length === 8
}
