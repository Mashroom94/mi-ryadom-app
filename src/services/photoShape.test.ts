import { describe, expect, it } from 'vitest'
import { adjustPhotoZoom, createUploadedPhotoCharacter, flowerPetalTips, normalizePhotoFraming, normalizePhotoShape, photoShapePaths } from './photoShape'

describe('uploaded photo shapes', () => {
  it('allows zooming out a photo inside its selected shape', () => {
    expect(normalizePhotoFraming({ scale: 0.75 }).scale).toBe(0.75)
  })

  it('accepts the four decorative shapes and falls back to heart', () => {
    expect(normalizePhotoShape('star')).toBe('star')
    expect(normalizePhotoShape('flower')).toBe('flower')
    expect(normalizePhotoShape('cloud')).toBe('cloud')
    expect(normalizePhotoShape('unknown')).toBe('heart')
  })

  it('stores the selected shape on the uploaded character', () => {
    expect(createUploadedPhotoCharacter('Фото', 'data:image/webp;base64,photo', 'cloud', undefined, 'photo-1')).toMatchObject({
      id: 'photo-1',
      kind: 'uploaded-image',
      name: 'Фото',
      assetPath: 'data:image/webp;base64,photo',
      photoShape: 'cloud',
    })
  })

  it('keeps one supplied id while framing settings change', () => {
    const character = createUploadedPhotoCharacter('Фото', 'data:image/webp;base64,photo', 'heart', { scale: 2, x: 20, y: -10 }, 'photo-stable')
    expect(character).toMatchObject({ id: 'photo-stable', photoScale: 2, photoOffsetX: 20, photoOffsetY: -10 })
  })

  it('provides a non-empty organic mask for every choice', () => {
    expect(Object.values(photoShapePaths).every((paths) => paths.length > 0 && paths.every(Boolean))).toBe(true)
  })

  it('uses one smooth six-petal daisy silhouette without extra leaves', () => {
    expect(photoShapePaths.flower).toHaveLength(1)
    expect(photoShapePaths.flower[0].match(/C/g)).toHaveLength(12)
    expect(photoShapePaths.flower[0]).not.toContain('L')
  })

  it('places six identical flower petal tips at equal radii and angles', () => {
    const radii = flowerPetalTips.map(({ x, y }) => Math.round(Math.hypot(x - 50, y - 50) * 100) / 100)
    expect(new Set(radii).size).toBe(1)
    expect(flowerPetalTips).toHaveLength(6)
    expect(flowerPetalTips[0]).toEqual({ x: 50, y: 4 })
  })

  it('persists a constrained photo framing with the uploaded character', () => {
    expect(createUploadedPhotoCharacter('Фото', 'data:image/webp;base64,photo', 'flower', { scale: 2.2, x: 18, y: -24 })).toMatchObject({
      photoScale: 2.2,
      photoOffsetX: 18,
      photoOffsetY: -24,
    })
    expect(normalizePhotoFraming({ scale: 9, x: -80, y: 75 })).toEqual({ scale: 4, x: -50, y: 50 })
  })

  it('keeps horizontal and vertical positioning independent from zoom', () => {
    expect(normalizePhotoFraming({ scale: 1, x: 35, y: -40 })).toEqual({ scale: 1, x: 35, y: -40 })
  })

  it('zooms uploaded photos in both directions and keeps the supported range', () => {
    expect(adjustPhotoZoom(2, -100)).toBeGreaterThan(2)
    expect(adjustPhotoZoom(2, 100)).toBeLessThan(2)
    expect(adjustPhotoZoom(4, -100)).toBe(4)
    expect(adjustPhotoZoom(1, 100)).toBeLessThan(1)
  })
})
