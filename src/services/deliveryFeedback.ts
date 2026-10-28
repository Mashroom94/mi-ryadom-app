import type { PartnerEvent } from '../models/types'
import type { TranslationKey } from '../i18n/dictionaries'

type DeliveryStatus = 'sent' | 'queued'

export function deliveryFeedbackKey(type: PartnerEvent['type'], status: DeliveryStatus): TranslationKey {
  if (type === 'sign') return status === 'sent' ? 'signSent' : 'signQueued'
  if (type === 'sticker') return 'stickerSent'
  return status === 'sent' ? 'actionSent' : 'actionQueued'
}
