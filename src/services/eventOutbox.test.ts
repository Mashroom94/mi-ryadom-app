import { describe, expect, it } from 'vitest'
import type { PartnerEvent } from '../models/types'
import { enqueueEvent } from './eventOutbox'

const event = (id: string, type: PartnerEvent['type'], payload: string): PartnerEvent => ({
  id,
  type,
  payload,
  createdAt: '2026-10-10T10:00:00.000Z',
  delivery: 'local',
  direction: 'sent',
  status: 'queued',
})

describe('event outbox', () => {
  it('keeps signs in order until the server can deliver them', () => {
    expect(enqueueEvent([event('one', 'sign', 'kiss')], event('two', 'sign', 'hug')).map((item) => item.id)).toEqual(['one', 'two'])
  })

  it('keeps only the latest mood and customization while offline', () => {
    const queued = enqueueEvent([
      event('old-mood', 'mood', 'calm'),
      event('old-character', 'customization', 'pig'),
    ], event('new-mood', 'mood', 'joy'))

    expect(queued.find((item) => item.type === 'mood')?.payload).toBe('joy')
    expect(queued.find((item) => item.type === 'customization')?.payload).toBe('pig')
  })
})
