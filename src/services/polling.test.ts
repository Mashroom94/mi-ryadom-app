import { describe, expect, it } from 'vitest'
import { shouldPoll } from './polling'

describe('shouldPoll', () => {
  it('polls only while the page is visible', () => {
    expect(shouldPoll('visible')).toBe(true)
    expect(shouldPoll('hidden')).toBe(false)
    expect(shouldPoll('prerender')).toBe(false)
  })
})
