import { describe, expect, it } from 'vitest'
import { assertSyncableAsset, dataUrlByteLength } from './assetLimits'

describe('uploaded character limits', () => {
  it('measures base64 payload size', () => {
    expect(dataUrlByteLength('data:image/webp;base64,AAAA')).toBe(3)
  })

  it('rejects an asset that could overflow shared_state', () => {
    expect(() => assertSyncableAsset(`data:model/gltf-binary;base64,${'A'.repeat(800_000)}`)).toThrow('asset-too-large')
  })
})
