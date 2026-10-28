import { describe, expect, it } from 'vitest'
import { MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from './displayName'

describe('display name', () => {
  it('trims and limits names to the home pagination capacity', () => {
    expect(normalizeDisplayName(`  ${'Я'.repeat(30)}  `)).toHaveLength(MAX_DISPLAY_NAME_LENGTH)
    expect(normalizeDisplayName('  Val  ')).toBe('Val')
  })
})
