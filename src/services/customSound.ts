export const MAX_CUSTOM_SOUND_BYTES = 256 * 1024
export const CUSTOM_SOUND_FORMATS = 'MP3, WAV, M4A, OGG, WebM'
export const CUSTOM_SOUND_ACCEPT = 'audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/ogg,audio/webm,.mp3,.wav,.m4a,.ogg,.webm'

export function validateCustomSound(file: { type: string; size: number }): 'ok' | 'type' | 'size' {
  if (!file.type.startsWith('audio/')) return 'type'
  if (file.size > MAX_CUSTOM_SOUND_BYTES) return 'size'
  return 'ok'
}
