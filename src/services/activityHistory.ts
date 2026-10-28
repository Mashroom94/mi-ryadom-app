import type { PartnerEvent } from '../models/types'

const HISTORY_LIMIT = 20

export function recordActivity(history: PartnerEvent[], event: PartnerEvent) {
  return [event, ...history.filter((item) => item.id !== event.id)].slice(0, HISTORY_LIMIT)
}

export function getRecentActivity(history: PartnerEvent[], limit = 5) {
  return history.slice(0, Math.max(0, limit))
}
