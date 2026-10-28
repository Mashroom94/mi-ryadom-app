import { describe, expect, it, vi } from 'vitest'
import { sendEventWithRetry } from './eventDelivery'

describe('sendEventWithRetry', () => {
  it('retries with the same event id after a temporary network failure', async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce({ deliveredToPartner: true, notificationQueued: true })

    const result = await sendEventWithRetry({ id: 'event-1' }, send)

    expect(result.status).toBe('sent')
    expect(send).toHaveBeenCalledTimes(2)
    expect(send.mock.calls[0][0].id).toBe('event-1')
    expect(send.mock.calls[1][0].id).toBe('event-1')
  })

  it('queues the event when neither attempt reaches the partner', async () => {
    const send = vi.fn().mockRejectedValue(new TypeError('offline'))
    await expect(sendEventWithRetry({ id: 'event-2' }, send)).resolves.toEqual({ status: 'queued', notificationQueued: false })
  })

  it('queues an accepted local action when the pair is temporarily unavailable', async () => {
    const send = vi.fn().mockResolvedValue({ deliveredToPartner: false, notificationQueued: false })
    await expect(sendEventWithRetry({ id: 'event-3' }, send)).resolves.toEqual({ status: 'queued', notificationQueued: false })
  })
})
