export const MAX_DISPLAY_NAME_LENGTH = 18

export function normalizeDisplayName(value: string) {
  return Array.from(value.trim()).slice(0, MAX_DISPLAY_NAME_LENGTH).join('')
}
