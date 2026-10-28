import { describe, expect, it } from 'vitest'
import { characters } from '../data/defaults'
import type { Character } from '../models/types'
import { coverCropRect, createFaceCharacter, faceEffectGeometry, faceMediaBox, faceMaskPreset, normalizeFaceEffect, normalizeFaceTransform, removeCustomCharacter, shouldUseNativeCamera, squareCropRect, upsertCustomCharacter } from './faceCharacter'

describe('face character', () => {
  it('allows enough zoom-out to frame a face taken on a phone', () => {
    expect(normalizeFaceTransform({ scale: 0.65 }).scale).toBe(0.65)
  })

  it('creates a transformer from an existing body and a local face photo', () => {
    const body = characters[2]
    const character = createFaceCharacter(body, 'data:image/jpeg;base64,face')

    expect(character).toMatchObject({
      id: 'face-transformer',
      kind: 'face-mask',
      bodyCharacterId: 'dinosaur',
      assetPath: body.assetPath,
      faceDataUrl: 'data:image/jpeg;base64,face',
    })
  })

  it('uses the universal wide organic mask for unknown bodies', () => {
    expect(faceMaskPreset('unknown')).toMatchObject({ x: 50, y: 50, width: 100, height: 100, family: 'wide' })
    expect(faceMaskPreset('unknown').path).toContain('C')
  })

  it('uses body-specific head shapes instead of one circular mask', () => {
    expect(faceMaskPreset('pig').width).toBeGreaterThanOrEqual(64)
    expect(faceMaskPreset('frog').width).toBeGreaterThanOrEqual(64)
    expect(faceMaskPreset('pig').path).not.toBe(faceMaskPreset('frog').path)
  })

  it('fits live camera media to the head opening instead of the full body canvas', () => {
    expect(faceMediaBox('pig')).toEqual({ x: 108, y: 254, width: 781, height: 601 })
    expect(faceMediaBox('frog')).toEqual({ x: 190, y: 89, width: 954, height: 655 })
    expect(faceMediaBox('dinosaur')).toEqual({ x: 48, y: 192, width: 782, height: 601 })
    expect(faceMediaBox('squirrel')).toEqual({ x: 49, y: 312, width: 781, height: 605 })
  })

  it('uses exactly two universal mask shapes across current and future bodies', () => {
    expect(faceMaskPreset('pig').family).toBe('wide')
    expect(faceMaskPreset('frog').family).toBe('frog')
    expect(faceMaskPreset('frog').path).not.toBe(faceMaskPreset('pig').path)
    expect(faceMaskPreset('dinosaur').family).toBe(faceMaskPreset('pig').family)
    expect(faceMaskPreset('squirrel').family).toBe(faceMaskPreset('pig').family)
    expect(faceMaskPreset('future-wide', 'wide').path).toBe(faceMaskPreset('squirrel').path)
    expect(faceMaskPreset('future-frog', 'frog').path).toBe(faceMaskPreset('frog').path)
  })

  it('uses the supplied Subtract 2 geometry for the pig cutout', () => {
    const pigMask = faceMaskPreset('pig')
    expect(pigMask).toMatchObject({ family: 'wide', x: 50, y: 50, width: 100, height: 100, viewBox: '0 0 1003 1386', canvasWidth: 1003, canvasHeight: 1386 })
    expect(pigMask.path).toBe('M547.672 254.609C507.572 253.563 473.647 251.149 443.42 251.57C413.173 251.992 386.55 255.253 360.993 265.581C309.873 286.239 263.153 335.116 200.094 445.645C168.566 500.906 146.016 543.764 131.216 578.05C116.418 612.33 109.351 638.08 108.825 659.114C107.772 701.266 132.996 724.33 174.147 758.972C206.475 786.185 260.774 809.009 326.492 825.555C392.225 842.104 469.439 852.386 547.646 854.48C625.855 856.575 699.662 849.012 757.713 832.767C786.738 824.644 811.841 814.347 831.59 801.99C851.336 789.635 865.757 775.203 873.373 758.8C888.552 726.106 889.71 696.678 882.719 657.526C875.736 618.422 860.597 569.503 843.159 497.89C825.69 426.149 792.024 366.372 742.605 324.005C693.184 281.635 628.04 256.706 547.672 254.609Z')
  })

  it('uses the supplied Subtract 3 geometry for the frog cutout', () => {
    const frogMask = faceMaskPreset('frog')
    expect(frogMask).toMatchObject({ family: 'frog', x: 50, y: 50, width: 100, height: 100, viewBox: '0 0 1338 1338', canvasWidth: 1338, canvasHeight: 1338 })
    expect(frogMask.path).toMatch(/^M417\.698 101\.829C366\.082 89\.5396/)
    expect(frogMask.path).toMatch(/557\.171 257\.311C518\.046 160\.009 469\.156 114\.081 417\.698 101\.829Z$/)
  })

  it('uses the supplied Subtract 4 geometry for the dinosaur cutout', () => {
    const dinosaurMask = faceMaskPreset('dinosaur')
    expect(dinosaurMask).toMatchObject({ family: 'wide', x: 50, y: 50, width: 100, height: 100, viewBox: '0 0 993 1372', canvasWidth: 993, canvasHeight: 1372 })
    expect(dinosaurMask.path).toBe('M487.672 192.609C447.572 191.563 413.647 189.149 383.42 189.57C353.173 189.992 326.55 193.253 300.993 203.581C249.873 224.239 203.153 273.116 140.094 383.645C108.566 438.906 86.0156 481.764 71.2158 516.05C56.4182 550.33 49.3511 576.08 48.8252 597.114C47.7716 639.266 72.9959 662.33 114.147 696.972C146.475 724.185 200.774 747.009 266.492 763.555C332.225 780.104 409.439 790.386 487.646 792.48C565.855 794.575 639.662 787.012 697.713 770.767C726.738 762.644 751.841 752.347 771.59 739.99C791.336 727.635 805.757 713.203 813.373 696.8C828.552 664.106 829.71 634.678 822.719 595.526C815.736 556.422 800.597 507.503 783.159 435.89C765.69 364.149 732.024 304.372 682.605 262.005C633.184 219.635 568.04 194.706 487.672 192.609Z')
  })

  it('uses the supplied Subtract geometry as the canonical dinosaur-family cutout', () => {
    const squirrelMask = faceMaskPreset('squirrel')
    expect(squirrelMask).toMatchObject({ family: 'wide', x: 50, y: 50, width: 100, height: 100, viewBox: '0 0 1078 1489' })
    expect(squirrelMask.path).toBe('M488.672 315.723C448.572 314.677 414.647 312.262 384.42 312.684C354.173 313.106 327.55 316.366 301.993 326.694C250.873 347.353 204.153 396.229 141.094 506.758C109.566 562.019 87.0156 604.878 72.2158 639.163C57.4183 673.443 50.3511 699.193 49.8252 720.228C48.7716 762.379 73.9959 785.443 115.147 820.085C147.475 847.299 201.774 870.123 267.492 886.668C333.225 903.217 410.439 913.499 488.646 915.594C566.855 917.689 640.662 910.125 698.713 893.88C727.738 885.757 752.841 875.46 772.59 863.104C792.336 850.748 806.757 836.316 814.373 819.913C829.552 787.219 830.71 757.791 823.719 718.64C816.736 679.535 801.597 630.616 784.159 559.003C766.69 487.262 733.024 427.485 683.605 385.118C634.184 342.749 569.041 317.819 488.672 315.723Z')
    expect(faceMaskPreset('future-wide', 'wide')).toMatchObject({ viewBox: squirrelMask.viewBox, path: squirrelMask.path })
  })

  it('persists and constrains face framing controls', () => {
    const transform = normalizeFaceTransform({ scale: 4, x: 80, y: -80 })
    expect(transform).toEqual({ scale: 3.2, x: 35, y: -35, stretchX: 1 })

    const character = createFaceCharacter(characters[0], 'data:image/jpeg;base64,face', { scale: 1.5, x: 12, y: -8 })
    expect(character).toMatchObject({ faceScale: 1.5, faceOffsetX: 12, faceOffsetY: -8, faceStretchX: 1 })
  })

  it('removes legacy face effects from transformer photos', () => {
    expect(normalizeFaceEffect('fisheye')).toBe('none')
    expect(normalizeFaceEffect('stretch')).toBe('none')
    expect(normalizeFaceEffect('distort')).toBe('none')
    expect(normalizeFaceEffect('twist')).toBe('none')
    expect(createFaceCharacter(characters[0], 'data:image/jpeg;base64,face').faceEffect).toBe('none')
  })

  it('keeps transformer photos geometrically neutral', () => {
    expect(faceEffectGeometry('fisheye')).toEqual({ scaleX: 1, scaleY: 1, rotate: 0, skewX: 0, skewY: 0, displacement: 0, frequencyX: 0, frequencyY: 0, seed: 0 })
  })

  it('centers a square crop inside portrait and landscape photos', () => {
    expect(squareCropRect(1200, 800)).toEqual({ x: 200, y: 0, size: 800 })
    expect(squareCropRect(600, 1000)).toEqual({ x: 0, y: 200, size: 600 })
  })

  it('captures the same aspect ratio shown inside the live head mask', () => {
    expect(coverCropRect(1200, 800, 1.5)).toEqual({ x: 0, y: 0, width: 1200, height: 800 })
    expect(coverCropRect(600, 1000, 1.5)).toEqual({ x: 0, y: 300, width: 600, height: 400 })
  })

  it('uses the native camera capture flow on phones and tablets', () => {
    expect(shouldUseNativeCamera('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)', 5)).toBe(true)
    expect(shouldUseNativeCamera('Mozilla/5.0 (Linux; Android 15; Mobile)', 5)).toBe(true)
    expect(shouldUseNativeCamera('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 5)).toBe(true)
    expect(shouldUseNativeCamera('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0)).toBe(false)
  })

  it('updates the transformer instead of adding duplicates', () => {
    const oldCharacter: Character = createFaceCharacter(characters[0], 'data:image/jpeg;base64,old')
    const uploaded: Character = { id: 'custom-1', kind: 'uploaded-image', nameKey: 'customCharacter', accent: '#fff' }
    const nextCharacter = createFaceCharacter(characters[1], 'data:image/jpeg;base64,new')

    const result = upsertCustomCharacter([oldCharacter, uploaded], nextCharacter)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(nextCharacter)
    expect(result[1]).toEqual(uploaded)
  })

  it('keeps separately saved transformers until the user deletes them', () => {
    const first = createFaceCharacter(characters[0], 'data:image/jpeg;base64,first', undefined, 'face-transformer-first')
    const second = createFaceCharacter(characters[1], 'data:image/jpeg;base64,second', undefined, 'face-transformer-second')

    const result = upsertCustomCharacter(upsertCustomCharacter([], first), second)

    expect(result).toHaveLength(2)
    expect(result.map((character) => character.id)).toEqual(['face-transformer-second', 'face-transformer-first'])
  })

  it('removes a custom character and safely leaves a removed selection', () => {
    const uploaded: Character = { id: 'custom-1', kind: 'uploaded-image', nameKey: 'customCharacter', accent: '#fff' }
    const result = removeCustomCharacter([uploaded], 'custom-1', 'custom-1', 'pig')
    expect(result).toEqual({ characters: [], characterId: 'pig' })
  })
})
