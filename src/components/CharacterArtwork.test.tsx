import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { characters } from '../data/defaults'
import { createFaceCharacter } from '../services/faceCharacter'
import { createUploadedPhotoCharacter } from '../services/photoShape'
import { CharacterArtwork } from './CharacterArtwork'

describe('CharacterArtwork', () => {
  it('keeps a face transformer in the exact aspect ratio of its body canvas', () => {
    const pig = characters.find((character) => character.id === 'pig')!
    const markup = renderToStaticMarkup(<CharacterArtwork character={createFaceCharacter(pig, 'data:image/jpeg;base64,face')} />)

    expect(markup).toContain('aspect-ratio:1003 / 1386')
  })

  it('keeps the frog transformer square without vertical drift', () => {
    const frog = characters.find((character) => character.id === 'frog')!
    const markup = renderToStaticMarkup(<CharacterArtwork character={createFaceCharacter(frog, 'data:image/jpeg;base64,face')} />)

    expect(markup).toContain('aspect-ratio:1338 / 1338')
  })

  it('keeps saved transformer framing and proportions in every placement', () => {
    const pig = characters.find((character) => character.id === 'pig')!
    const markup = renderToStaticMarkup(<CharacterArtwork character={createFaceCharacter(pig, 'data:image/jpeg;base64,face', { scale: 2.4, x: 27, y: -16 })} />)

    expect(markup).not.toContain('width:auto;height:100%;max-width:100%')
    expect(markup).toContain('--face-photo-scale:2.4')
    expect(markup).toContain('--face-photo-x:27%')
    expect(markup).toContain('--face-photo-y:-16%')
    expect(markup).toContain('face-character--effect-none')
    expect(markup).toContain('feDisplacementMap')
    expect(markup).toContain('scale="0"')
  })

  it('pins saved photo framing to the same crop origin in every container', () => {
    const squirrel = characters.find((character) => character.id === 'squirrel')!
    const transformerMarkup = renderToStaticMarkup(<CharacterArtwork character={createFaceCharacter(squirrel, 'data:image/jpeg;base64,face', { scale: 1.8, x: 12, y: 13 })} />)
    const photoMarkup = renderToStaticMarkup(<CharacterArtwork character={createUploadedPhotoCharacter('Фото', 'data:image/jpeg;base64,photo', 'flower', { scale: 1.6, x: -18, y: 24 })} />)

    expect(transformerMarkup).toContain('<image')
    expect(photoMarkup).toContain('<image')
    expect(transformerMarkup).toContain('preserveAspectRatio="xMidYMid slice"')
    expect(photoMarkup).toContain('preserveAspectRatio="xMidYMid slice"')
    expect(transformerMarkup).not.toContain('foreignObject')
    expect(photoMarkup).not.toContain('foreignObject')
  })

  it('does not draw an outline around the transformer face mask', () => {
    const pig = characters.find((character) => character.id === 'pig')!
    const markup = renderToStaticMarkup(<CharacterArtwork character={createFaceCharacter(pig, 'data:image/jpeg;base64,face')} />)

    expect(markup).not.toContain('face-character__outline')
  })
})
