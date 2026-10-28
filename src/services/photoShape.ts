import type { Character, PhotoShape } from '../models/types'

export interface PhotoFraming { scale: number; x: number; y: number }

interface Point { x: number; y: number }

const polarPoint = (angle: number, radius: number): Point => {
  const radians = angle * Math.PI / 180
  return {
    x: Number((50 + Math.cos(radians) * radius).toFixed(2)),
    y: Number((50 + Math.sin(radians) * radius).toFixed(2)),
  }
}

const flowerPetalAngles = Array.from({ length: 6 }, (_, index) => -90 + index * 60)
export const flowerPetalTips = flowerPetalAngles.map((angle) => polarPoint(angle, 46))

const flowerPath = flowerPetalAngles.reduce((path, angle, index) => {
  const tip = flowerPetalTips[index]
  const controlBeforeValley = polarPoint(angle - 28, 34)
  const controlBeforeTip = polarPoint(angle - 18, 46)
  const controlAfterTip = polarPoint(angle + 18, 46)
  const controlAfterValley = polarPoint(angle + 28, 34)
  const nextValley = polarPoint(angle + 30, 24)
  return `${path} C${controlBeforeValley.x} ${controlBeforeValley.y} ${controlBeforeTip.x} ${controlBeforeTip.y} ${tip.x} ${tip.y} C${controlAfterTip.x} ${controlAfterTip.y} ${controlAfterValley.x} ${controlAfterValley.y} ${nextValley.x} ${nextValley.y}`
}, `M${polarPoint(-120, 24).x} ${polarPoint(-120, 24).y}`) + ' Z'

export const photoShapePaths: Record<PhotoShape, string[]> = {
  heart: ['M50 91 C42 83 13 63 9 39 C5 18 30 6 50 26 C70 6 95 18 91 39 C87 63 58 83 50 91 Z'],
  star: ['M50 5 L61 36 L95 37 L68 57 L77 90 L50 71 L23 90 L32 57 L5 37 L39 36 Z'],
  flower: [flowerPath],
  cloud: ['M20 80 C6 80 0 69 5 57 C8 48 16 43 26 44 C29 28 42 18 57 21 C70 22 80 31 82 44 C94 46 101 56 97 68 C94 76 87 80 77 80 Z'],
}

export function normalizePhotoShape(value: unknown): PhotoShape {
  return value === 'star' || value === 'flower' || value === 'cloud' ? value : 'heart'
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function normalizePhotoFraming(settings?: Partial<PhotoFraming>): PhotoFraming {
  const scale = clamp(Number.isFinite(settings?.scale) ? Number(settings?.scale) : 1, 0.65, 4)
  return {
    scale,
    x: clamp(Number.isFinite(settings?.x) ? Number(settings?.x) : 0, -50, 50),
    y: clamp(Number.isFinite(settings?.y) ? Number(settings?.y) : 0, -50, 50),
  }
}

export function adjustPhotoZoom(currentScale: number, wheelDelta: number) {
  return normalizePhotoFraming({ scale: currentScale * Math.exp(-wheelDelta * 0.0015) }).scale
}

export function createUploadedPhotoCharacter(name: string, assetPath: string, photoShape: unknown, settings?: Partial<PhotoFraming>, characterId?: string): Character {
  const framing = normalizePhotoFraming(settings)
  return {
    id: characterId ?? `custom-${Date.now()}`,
    kind: 'uploaded-image',
    nameKey: 'customCharacter',
    name,
    accent: '#8c9be6',
    assetPath,
    photoShape: normalizePhotoShape(photoShape),
    photoScale: framing.scale,
    photoOffsetX: framing.x,
    photoOffsetY: framing.y,
  }
}
