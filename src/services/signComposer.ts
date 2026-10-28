import type { SignId } from '../models/types'

export function canSendSelectedSign(selectedSign: SignId | null, sending: boolean): boolean {
  return Boolean(selectedSign) && !sending
}
