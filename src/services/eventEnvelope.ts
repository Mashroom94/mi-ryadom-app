import type { PartnerEvent, SharedProfile } from '../models/types'

export function createEventEnvelope(event: PartnerEvent, state?: SharedProfile) {
  return state ? { ...event, state } : event
}
