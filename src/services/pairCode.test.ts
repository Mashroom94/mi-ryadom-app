import { beforeEach, describe, expect, it } from 'vitest'
import { normalizePairCode, readSavedPairCode, savePairCode } from './pairCode'

const values = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } })

describe('pair code', () => {
  beforeEach(() => values.clear())

  it('keeps an entered code available after reload', () => {
    savePairCode(' ab-12 cd34 ')
    expect(readSavedPairCode()).toBe('AB12CD34')
  })

  it('accepts old six-digit and new eight-character codes', () => {
    expect(normalizePairCode('123 456')).toBe('123456')
    expect(normalizePairCode('xy-z9 12ab')).toBe('XYZ912AB')
  })
})
