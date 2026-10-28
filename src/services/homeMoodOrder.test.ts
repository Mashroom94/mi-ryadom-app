import { describe, expect, it } from 'vitest'
import { homeMoodOrder } from './homeMoodOrder'

describe('home mood order', () => {
  it('places sadness before tiredness while keeping every label on one row', () => {
    expect(homeMoodOrder).toEqual(['calm', 'joy', 'romance', 'sadness', 'tiredness', 'anger'])
  })
})
