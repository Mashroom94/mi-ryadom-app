import { describe, expect, it } from 'vitest'
import { resolvePartnerName } from './partnerName'

describe('resolvePartnerName', () => {
  it('uses the connected partner name while the local name is still a placeholder', () => {
    expect(resolvePartnerName('Alex', 'Маша', true, 'Alex')).toBe('Маша')
  })

  it('uses the latest name entered by the connected partner', () => {
    expect(resolvePartnerName('Маша', 'Мария', true, 'Alex')).toBe('Мария')
  })
})
