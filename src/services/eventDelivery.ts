interface SendResult { deliveredToPartner: boolean; notificationQueued: boolean }

export async function sendEventWithRetry<T>(event: T, send: (event: T) => Promise<SendResult>) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await send(event)
      if (result.deliveredToPartner) return { status: 'sent' as const, notificationQueued: result.notificationQueued }
      return { status: 'queued' as const, notificationQueued: false }
    } catch {
      if (attempt === 1) return { status: 'queued' as const, notificationQueued: false }
    }
  }
  return { status: 'queued' as const, notificationQueued: false }
}
