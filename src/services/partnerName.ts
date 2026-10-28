import { normalizeDisplayName } from './displayName'

export function resolvePartnerName(currentName: string, remoteName: string | null, paired: boolean, placeholderName: string): string {
  void placeholderName
  if (!paired || !remoteName) return normalizeDisplayName(currentName)
  return normalizeDisplayName(remoteName)
}
