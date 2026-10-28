import type { PartnerEvent, SharedProfile } from '../models/types'
import { remotePartnerService } from './remotePartner'
import { sendEventWithRetry } from './eventDelivery'
import { eventOutbox } from './eventOutbox'

export interface PartnerEventService {
  send(type: PartnerEvent['type'], payload: string, eventId?: string, sharedState?: SharedProfile): Promise<PartnerEvent>
  flush(): Promise<string[]>
  subscribe(onEvent: (event: PartnerEvent) => void, onPresence: (online: boolean) => void): () => void
}

const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
const tabId = createId()
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('my-ryadom:partner-v1')

export const localPartnerEventService: PartnerEventService = {
  async send(type, payload, eventId, sharedState) {
    await Promise.resolve()
    const event: PartnerEvent = {
      id: eventId ?? createId(),
      type,
      payload,
      createdAt: new Date().toISOString(),
      delivery: 'local',
      direction: 'sent',
    }
    const result = await sendEventWithRetry(event, (item) => remotePartnerService.send(item, sharedState))
    if (result.status === 'sent') return { ...event, delivery: 'remote', status: 'sent' }
    eventOutbox.enqueue(event)
    channel?.postMessage({ kind: 'event', source: tabId, event })
    return { ...event, status: 'queued' }
  },
  async flush() {
    const queued = eventOutbox.load()
    if (!queued.length) return []
    const remaining: PartnerEvent[] = []
    const sent: string[] = []
    for (let index = 0; index < queued.length; index += 1) {
      const event = queued[index]
      const result = await sendEventWithRetry(event, remotePartnerService.send)
      if (result.status === 'sent') sent.push(event.id)
      else {
        remaining.push(...queued.slice(index))
        break
      }
    }
    eventOutbox.save(remaining)
    return sent
  },
  subscribe(onEvent, onPresence) {
    if (!channel) {
      onPresence(false)
      return () => undefined
    }
    let lastSeen = 0
    const announce = () => channel.postMessage({ kind: 'presence', source: tabId })
    const handle = (message: MessageEvent<{ kind: string; source: string; event?: PartnerEvent }>) => {
      if (!message.data || message.data.source === tabId) return
      lastSeen = Date.now()
      onPresence(true)
      if (message.data.kind === 'event' && message.data.event) {
        onEvent({ ...message.data.event, id: createId(), direction: 'received' })
      }
      if (message.data.kind === 'hello') announce()
    }
    channel.addEventListener('message', handle)
    const heartbeat = window.setInterval(announce, 4000)
    const presenceCheck = window.setInterval(() => onPresence(Date.now() - lastSeen < 9500), 3000)
    channel.postMessage({ kind: 'hello', source: tabId })
    announce()
    return () => {
      channel.removeEventListener('message', handle)
      window.clearInterval(heartbeat)
      window.clearInterval(presenceCheck)
    }
  },
}

