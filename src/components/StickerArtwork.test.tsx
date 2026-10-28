import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Character } from '../models/types'
import { StickerArtwork } from './StickerArtwork'

describe('StickerArtwork', () => {
  it('keeps the selected shape and framing for an uploaded photo sticker', () => {
    const character: Character = { id: 'photo', kind: 'uploaded-image', nameKey: 'customCharacter', accent: '#fff', assetPath: 'data:image/webp;base64,photo', photoShape: 'flower', photoScale: 2.2, photoOffsetX: 18, photoOffsetY: -24 }
    const markup = renderToStaticMarkup(<StickerArtwork character={character} />)
    expect(markup).toContain('photo-character--flower')
    expect(markup).toContain('preserveAspectRatio="xMidYMid slice"')
    expect(markup).toContain('transform="translate(18 -24) translate(50 50) scale(2.2) translate(-50 -50)"')
    expect(markup).not.toContain('foreignObject')
  })

  it('renders transformer stickers with their face mask instead of a flat image', () => {
    const character: Character = { id: 'face-transformer', kind: 'face-mask', nameKey: 'transformerCharacter', accent: '#fff', bodyCharacterId: 'frog', faceDataUrl: 'data:image/jpeg;base64,face' }
    expect(renderToStaticMarkup(<StickerArtwork character={character} />)).toContain('face-character__mask--frog')
  })
})
