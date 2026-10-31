import { useId } from 'react'
import { characters } from '../data/defaults'
import type { Character } from '../models/types'
import { faceEffectGeometry, faceMaskPreset, faceMediaBox, normalizeFaceEffect } from '../services/faceCharacter'
import { normalizePhotoFraming, normalizePhotoShape, photoShapePaths } from '../services/photoShape'

export function CharacterArtwork({ character, onError }: { character: Character; onError?: () => void }) {
  const id = useId().replace(/:/g, '')
  if (character.kind === 'face-mask') {
    const body = characters.find((item) => item.id === character.bodyCharacterId) ?? characters[0]
    const mask = faceMaskPreset(body.id, body.faceMaskFamily)
    const media = faceMediaBox(body.id, body.faceMaskFamily)
    const effect = normalizeFaceEffect(character.faceEffect)
    const effectGeometry = faceEffectGeometry(effect)
    const effectTransform = `rotate(${effectGeometry.rotate}deg) skewX(${effectGeometry.skewX}deg) skewY(${effectGeometry.skewY}deg) scaleX(${effectGeometry.scaleX}) scaleY(${effectGeometry.scaleY})`
    const renderedScale = character.faceScale ?? 1
    const renderedStretchX = character.faceStretchX ?? 1
    const faceX = character.faceOffsetX ?? 0
    const faceY = character.faceOffsetY ?? 0
    const faceTransform = `translate(${faceX / 100 * media.width} ${faceY / 100 * media.height}) translate(${media.x + media.width / 2} ${media.y + media.height / 2}) scale(${renderedScale * renderedStretchX} ${renderedScale}) translate(${-(media.x + media.width / 2)} ${-(media.y + media.height / 2)})`
    return (
      <span
        className={`face-character face-character--${body.id} face-character--effect-${effect}`}
        style={{ aspectRatio: `${mask.canvasWidth} / ${mask.canvasHeight}`, '--face-x': `${mask.x}%`, '--face-y': `${mask.y}%`, '--face-width': `${mask.width}%`, '--face-height': `${mask.height}%`, '--face-photo-scale': renderedScale, '--face-photo-x': `${character.faceOffsetX ?? 0}%`, '--face-photo-y': `${character.faceOffsetY ?? 0}%`, '--face-effect-transform': effectTransform } as React.CSSProperties}
      >
        <span className={`face-character__mask face-character__mask--${mask.family}`}>
          <svg viewBox={mask.viewBox} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <clipPath id={`${id}-clip`}><path d={mask.path} /></clipPath>
              <filter id={`${id}-warp`} x="-45%" y="-45%" width="190%" height="190%" colorInterpolationFilters="sRGB">
                <feTurbulence type="turbulence" baseFrequency={`${effectGeometry.frequencyX} ${effectGeometry.frequencyY}`} numOctaves="1" seed={effectGeometry.seed} result="warp" />
                <feDisplacementMap in="SourceGraphic" in2="warp" scale={effectGeometry.displacement} xChannelSelector="R" yChannelSelector="B" />
              </filter>
              <radialGradient id={`${id}-volume`} cx="38%" cy="28%" r="76%"><stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset=".58" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#1f2941" stopOpacity=".14" /></radialGradient>
              <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".72" /><stop offset=".38" stopColor="#fff" stopOpacity=".08" /><stop offset=".68" stopColor="#fff" stopOpacity="0" /></linearGradient>
            </defs>
            <g clipPath={`url(#${id}-clip)`}>
              {character.faceDataUrl
                ? <image className="face-character__svg-photo" href={character.faceDataUrl} x={media.x} y={media.y} width={media.width} height={media.height} preserveAspectRatio="xMidYMid slice" transform={faceTransform} onError={onError} />
                : <text className="face-character__placeholder" x="50%" y="50%" textAnchor="middle">+</text>}
              <path d={mask.path} fill={`url(#${id}-volume)`} />
              <path className="face-character__effect-shine" d={mask.path} fill={`url(#${id}-gloss)`} />
            </g>
          </svg>
        </span>
        <img className="face-character__body" src={body.transformerAssetPath ?? body.assetPath} alt="" aria-hidden="true" draggable="false" onError={onError} />
      </span>
    )
  }

  if (character.kind === 'uploaded-image' && character.assetPath) {
    const shape = normalizePhotoShape(character.photoShape)
    const paths = photoShapePaths[shape]
    const framing = normalizePhotoFraming({ scale: character.photoScale, x: character.photoOffsetX, y: character.photoOffsetY })
    const photoTransform = `translate(${framing.x} ${framing.y}) translate(50 50) scale(${framing.scale}) translate(-50 -50)`
    return <span className={`photo-character photo-character--${shape}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs><clipPath id={`${id}-photo-shape`}>{paths.map((path) => <path key={path} d={path} />)}</clipPath></defs>
        <g clipPath={`url(#${id}-photo-shape)`}><image className="photo-character__svg-photo" href={character.assetPath} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" transform={photoTransform} onError={onError} /></g>
        <g className="photo-character__outline">{paths.map((path) => <path key={path} d={path} />)}</g>
      </svg>
    </span>
  }

  return character.assetPath ? <img src={character.assetPath} alt="" aria-hidden="true" draggable="false" onError={onError} /> : null
}
