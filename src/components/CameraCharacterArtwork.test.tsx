import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { characters } from '../data/defaults'
import { CameraCharacterArtwork } from './CameraCharacterArtwork'

describe('CameraCharacterArtwork', () => {
  it('keeps the selected body visible and renders the live camera through a canvas on iOS', () => {
    const markup = renderToStaticMarkup(<CameraCharacterArtwork body={characters[0]} videoRef={createRef<HTMLVideoElement>()} />)

    expect(markup).toContain('face-character__body')
    expect(markup).toContain('camera-character__canvas')
    expect(markup).toContain('<canvas')
    expect(markup).toContain('camera-character__source')
    expect(markup).toContain('<video')
    expect(markup).toContain('playsinline=""')
    expect(markup).not.toContain('<foreignObject')
    expect(markup).not.toContain('clip-path="url(#')
  })
})
