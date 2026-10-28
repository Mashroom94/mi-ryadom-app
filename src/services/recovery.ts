export function normalizeRecoveryKey(value: string) {
  const key = value.trim()
  if (!/^[A-Za-z0-9_-]{43,64}$/.test(key)) throw new Error('invalid-recovery-key')
  return key
}
