export const TOUCH_DEDUPE_MS = 10_000

export function shouldSendTouch(lastSentAt: number | null, now: number) {
  return lastSentAt === null || now - lastSentAt >= TOUCH_DEDUPE_MS
}
