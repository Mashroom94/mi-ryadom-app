import { describe, expect, it } from 'vitest'
import { shouldCheckForUpdate, shouldReloadOnControllerChange } from './pwaUpdate'

describe('shouldReloadOnControllerChange', () => {
  it('reloads once for every newly activated service worker', () => {
    expect(shouldReloadOnControllerChange(false)).toBe(true)
    expect(shouldReloadOnControllerChange(true)).toBe(false)
  })
})

describe('shouldCheckForUpdate', () => {
  it('checks immediately the first time and throttles repeated mobile lifecycle events', () => {
    expect(shouldCheckForUpdate(0, 100_000, 30_000)).toBe(true)
    expect(shouldCheckForUpdate(90_000, 100_000, 30_000)).toBe(false)
    expect(shouldCheckForUpdate(70_000, 100_000, 30_000)).toBe(true)
  })
})
