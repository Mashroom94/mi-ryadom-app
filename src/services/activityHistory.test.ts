import { describe, expect, it } from 'vitest'
import type { PartnerEvent } from '../models/types'
import { getRecentActivity, recordActivity } from './activityHistory'

const events: PartnerEvent[] = Array.from({ length: 7 }, (_, index) => ({
  id: `event-${index + 1}`,
  type: 'sign',
  payload: 'hug',
  createdAt: `2026-10-12T00:0${index}:00.000Z`,
  delivery: 'local',
  direction: 'sent',
}))

describe('recent activity folder', () => {
  it('shows only the five newest entries without changing the journal', () => {
    const recent = getRecentActivity(events)

    expect(recent.map((event) => event.id)).toEqual(['event-1', 'event-2', 'event-3', 'event-4', 'event-5'])
    expect(events).toHaveLength(7)
  })

  it('keeps a single newest copy of an event and caps the journal at twenty entries', () => {
    const longHistory: PartnerEvent[] = Array.from({ length: 20 }, (_, index) => ({
      ...events[0],
      id: `event-${index + 1}`,
      createdAt: `2026-10-12T00:${String(index).padStart(2, '0')}:00.000Z`,
    }))
    const updated = recordActivity(longHistory, { ...longHistory[5], status: 'sent', delivery: 'remote' })
    const withNewEvent = recordActivity(updated, { ...longHistory[0], id: 'event-21' })

    expect(updated).toHaveLength(20)
    expect(updated[0]).toMatchObject({ id: 'event-6', status: 'sent', delivery: 'remote' })
    expect(updated.filter((event) => event.id === 'event-6')).toHaveLength(1)
    expect(withNewEvent).toHaveLength(20)
    expect(withNewEvent.some((event) => event.id === 'event-20')).toBe(false)
  })
})
