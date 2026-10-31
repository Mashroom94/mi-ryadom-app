import type { MoodId, PartnerEvent, SharedProfile } from '../models/types'
import type { TranslationKey } from '../i18n/dictionaries'

const eventLabelKeys: Record<Exclude<PartnerEvent['type'], 'mood' | 'sign' | 'sticker'>, TranslationKey> = {
  touch: 'touchReceived',
  wishlist: 'wishlistUpdated',
  idea: 'ideasUpdated',
  customization: 'customizationUpdated',
  notes: 'notesUpdated',
}

export function receivedEventLabelKey(event: PartnerEvent): TranslationKey {
  if (event.type === 'mood' || event.type === 'sign') return event.payload as TranslationKey
  if (event.type === 'sticker') return `sticker${event.payload[0]?.toUpperCase() ?? ''}${event.payload.slice(1)}` as TranslationKey
  return eventLabelKeys[event.type]
}

export function latestReceivedEventId(history: PartnerEvent[]): string | null {
  return history.find((event) => event.direction === 'received')?.id ?? null
}

export function resolvePartnerMood(shared: SharedProfile | undefined, history: PartnerEvent[]): MoodId | undefined {
  const receivedMood = history.find((event) => event.type === 'mood' && event.direction === 'received')
  const sharedUpdatedAt = shared?.moodUpdatedAt ? new Date(shared.moodUpdatedAt).getTime() : 0
  const eventUpdatedAt = receivedMood ? new Date(receivedMood.createdAt).getTime() : 0
  return (sharedUpdatedAt >= eventUpdatedAt ? shared?.mood : receivedMood?.payload) as MoodId | undefined
}

export function resolveUnseenCue(history: PartnerEvent[], type: 'sign' | 'sticker' | 'touch', seenId: string | null) {
  const received = history.filter((item) => item.type === type && item.direction === 'received')
  if (!received.length) return null
  if (!seenId) return received[0]
  const seenIndex = received.findIndex((item) => item.id === seenId)
  if (seenIndex <= 0) return seenIndex === 0 ? null : received[0]
  return received[seenIndex - 1]
}

export function drawingIdFromEvent(event: PartnerEvent) {
  return event.type === 'notes' && event.payload.startsWith('drawing:') ? event.payload.slice('drawing:'.length) : null
}

export function resolveUnseenDrawing(history: PartnerEvent[], seenId: string | null) {
  const event = history.find((item) => item.direction === 'received' && drawingIdFromEvent(item))
  return event && event.id !== seenId ? event : null
}

export function isTicTurnEvent(event: PartnerEvent) {
  return event.type === 'notes' && event.payload === 'tic-turn'
}

export function isTicInviteEvent(event: PartnerEvent) {
  return event.type === 'notes' && event.payload === 'tic-invite'
}

export function ticResultFromEvent(event: PartnerEvent): 'win' | 'loss' | 'draw' | null {
  if (event.type !== 'notes') return null
  if (event.payload === 'tic-result-win') return 'win'
  if (event.payload === 'tic-result-loss') return 'loss'
  if (event.payload === 'tic-result-draw') return 'draw'
  return null
}

export function isMoneyUpdatedEvent(event: PartnerEvent) {
  return event.type === 'notes' && event.payload === 'money-updated'
}
