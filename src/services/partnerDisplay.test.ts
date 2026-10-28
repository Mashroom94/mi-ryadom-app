import { describe, expect, it } from 'vitest'
import { createDefaultState } from '../data/defaults'
import type { PartnerEvent, SharedProfile } from '../models/types'
import { drawingIdFromEvent, isTicTurnEvent, latestReceivedEventId, receivedEventLabelKey, resolvePartnerMood, resolveUnseenCue, resolveUnseenDrawing } from './partnerDisplay'

const received = (id: string, type: PartnerEvent['type'], payload: string, createdAt: string): PartnerEvent => ({
  id,
  type,
  payload,
  createdAt,
  delivery: 'remote',
  direction: 'received',
})

describe('partner display cues', () => {
  it('keeps the partner mood visible until the partner chooses another mood', () => {
    const state = createDefaultState('ru')
    const shared: SharedProfile = {
      customization: state.customization,
      customCharacters: [],
      wishlist: [],
      ideas: [],
      mood: 'calm',
      moodUpdatedAt: '2026-01-01T00:00:00.000Z',
    }

    expect(resolvePartnerMood(shared, [])).toBe('calm')
  })

  it('uses the newest received mood when it is newer than shared state', () => {
    const state = createDefaultState('ru')
    const shared: SharedProfile = {
      customization: state.customization,
      customCharacters: [],
      wishlist: [],
      ideas: [],
      mood: 'calm',
      moodUpdatedAt: '2026-10-09T00:00:00.000Z',
    }
    const history = [received('mood-new', 'mood', 'joy', '2026-10-10T00:00:00.000Z')]

    expect(resolvePartnerMood(shared, history)).toBe('joy')
  })

  it('returns an unseen sign once and ignores it after it was viewed', () => {
    const history = [received('sign-1', 'sign', 'hug', '2026-10-10T00:00:00.000Z')]

    expect(resolveUnseenCue(history, 'sign', null)?.payload).toBe('hug')
    expect(resolveUnseenCue(history, 'sign', 'sign-1')).toBeNull()
  })

  it('finds an unseen sticker even when a newer sign is also in history', () => {
    const history = [
      received('sign-new', 'sign', 'kiss', '2026-10-10T10:01:00.000Z'),
      received('sticker-1', 'sticker', 'warmth', '2026-10-10T10:00:00.000Z'),
    ]

    expect(resolveUnseenCue(history, 'sticker', null)?.id).toBe('sticker-1')
  })

  it('uses a friendly label for customization updates instead of an internal character id', () => {
    const event = received('customization-1', 'customization', 'squirrel', '2026-10-10T10:02:00.000Z')

    expect(receivedEventLabelKey(event)).toBe('customizationUpdated')
    expect(receivedEventLabelKey(event)).not.toBe('squirrel')
  })

  it('maps every received event type to user-facing copy', () => {
    expect(receivedEventLabelKey(received('sign-2', 'sign', 'hug', '2026-10-10T10:02:00.000Z'))).toBe('hug')
    expect(receivedEventLabelKey(received('sticker-2', 'sticker', 'warmth', '2026-10-10T10:02:00.000Z'))).toBe('stickerWarmth')
    expect(receivedEventLabelKey(received('touch-1', 'touch', 'character-touch', '2026-10-10T10:02:00.000Z'))).toBe('touchReceived')
    expect(receivedEventLabelKey(received('wishlist-1', 'wishlist', 'gift', '2026-10-10T10:02:00.000Z'))).toBe('wishlistUpdated')
    expect(receivedEventLabelKey(received('idea-1', 'idea', 'quiet', '2026-10-10T10:02:00.000Z'))).toBe('ideasUpdated')
  })

  it('returns an unseen touch cue for the distinct greeting animation', () => {
    const history = [received('touch-2', 'touch', 'character-touch', '2026-10-10T10:02:00.000Z')]

    expect(resolveUnseenCue(history, 'touch', null)?.id).toBe('touch-2')
    expect(resolveUnseenCue(history, 'touch', 'touch-2')).toBeNull()
  })

  it('queues frequent signs in arrival order instead of skipping intermediate signs', () => {
    const history = [
      received('sign-3', 'sign', 'support', '2026-10-10T10:03:00.000Z'),
      received('sign-2', 'sign', 'kiss', '2026-10-10T10:02:00.000Z'),
      received('sign-1', 'sign', 'hug', '2026-10-10T10:01:00.000Z'),
    ]
    expect(resolveUnseenCue(history, 'sign', 'sign-1')?.id).toBe('sign-2')
    expect(resolveUnseenCue(history, 'sign', 'sign-2')?.id).toBe('sign-3')
  })

  it('remembers the latest received event so reopening home does not announce stale activity', () => {
    const history = [
      received('received-new', 'customization', 'squirrel', '2026-10-10T10:02:00.000Z'),
      { ...received('sent-newer', 'sign', 'hug', '2026-10-10T10:03:00.000Z'), direction: 'sent' as const },
    ]

    expect(latestReceivedEventId(history)).toBe('received-new')
    expect(latestReceivedEventId([])).toBeNull()
  })

  it('finds an unseen drawing event and extracts its drawing id', () => {
    const history = [received('drawing-event', 'notes', 'drawing:drawing-42', '2026-10-10T10:02:00.000Z')]
    expect(resolveUnseenDrawing(history, null)?.id).toBe('drawing-event')
    expect(resolveUnseenDrawing(history, 'drawing-event')).toBeNull()
    expect(drawingIdFromEvent(history[0])).toBe('drawing-42')
  })

  it('recognises only the tic-tac-toe turn event as a turn notification', () => {
    expect(isTicTurnEvent(received('turn', 'notes', 'tic-turn', '2026-10-10T10:02:00.000Z'))).toBe(true)
    expect(isTicTurnEvent(received('finished', 'notes', 'tic-finished', '2026-10-10T10:03:00.000Z'))).toBe(false)
  })
})
