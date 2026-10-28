import type { PartnerEvent } from '../models/types'

const OUTBOX_KEY = 'my-ryadom:event-outbox-v1'
const REPLACEABLE_TYPES = new Set<PartnerEvent['type']>(['mood', 'customization', 'touch'])

export function enqueueEvent(current: PartnerEvent[], event: PartnerEvent) {
  const retained = REPLACEABLE_TYPES.has(event.type) ? current.filter((item) => item.type !== event.type) : current
  return [...retained, { ...event, status: 'queued' as const }].slice(-30)
}

export const eventOutbox = {
  load(): PartnerEvent[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },
  enqueue(event: PartnerEvent) {
    const queued = enqueueEvent(this.load(), event)
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(queued)) } catch { /* Keep the current session usable. */ }
  },
  save(events: PartnerEvent[]) {
    try {
      if (events.length) localStorage.setItem(OUTBOX_KEY, JSON.stringify(events))
      else localStorage.removeItem(OUTBOX_KEY)
    } catch { /* Retry again during the next sync. */ }
  },
}
