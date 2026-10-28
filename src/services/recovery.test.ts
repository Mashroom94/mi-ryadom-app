import { describe, expect, it } from 'vitest'
import { normalizeRecoveryKey } from './recovery'

describe('recovery keys', () => {
  it('accepts a 256-bit base64url recovery key', () => {
    const key = 'AbCdEf0123456789_-AbCdEf0123456789_-AbCdEf0123'
    expect(normalizeRecoveryKey(`  ${key}  `)).toBe(key)
  })

  it('rejects short or guessable recovery codes', () => {
    expect(() => normalizeRecoveryKey('123456')).toThrow('invalid-recovery-key')
  })
})
