export const MAX_SYNCED_ASSET_BYTES = 550_000

export function dataUrlByteLength(value: string) {
  const base64 = value.slice(value.indexOf(',') + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor(base64.length * 3 / 4) - padding)
}

export function assertSyncableAsset(value: string) {
  if (dataUrlByteLength(value) > MAX_SYNCED_ASSET_BYTES) throw new Error('asset-too-large')
  return value
}
