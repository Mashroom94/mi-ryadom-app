import { describe, expect, it } from 'vitest'
import { normalizePushChange } from './pushSubscription'

describe('normalizePushChange', () => {
  it('accepts a secure replacement subscription', () => {
    expect(normalizePushChange('https://push.example/new', 'https://push.example/old')).toEqual({
      endpoint: 'https://push.example/new',
      oldEndpoint: 'https://push.example/old',
    })
  })

  it('rejects non-HTTPS endpoints', () => {
    expect(() => normalizePushChange('http://push.example/new')).toThrow('Некорректная подписка')
  })
})
