import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { coverCropRect, faceMaskPreset, faceMediaBox } from '../services/faceCharacter'
import type { Character } from '../models/types'

export function CameraCharacterArtwork({ body, videoRef }: { body: Character; videoRef: RefObject<HTMLVideoElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mask = faceMaskPreset(body.id, body.faceMaskFamily)
  const media = faceMediaBox(body.id, body.faceMaskFamily)

  useEffect(() => {
    let animationFrame = 0

    const drawCamera = () => {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      const cssWidth = Math.max(1, canvas.clientWidth)
      const cssHeight = Math.max(1, canvas.clientHeight)
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.round(cssWidth * pixelRatio)
      const height = Math.round(cssHeight * pixelRatio)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      const context = canvas.getContext('2d')
      context?.clearRect(0, 0, width, height)

      if (context && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
        const crop = coverCropRect(video.videoWidth, video.videoHeight, media.width / media.height)
        const scaleX = width / mask.canvasWidth
        const scaleY = height / mask.canvasHeight

        context.save()
        context.scale(scaleX, scaleY)
        context.clip(new Path2D(mask.path))
        context.translate(media.x + media.width, media.y)
        context.scale(-1, 1)
        context.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, media.width, media.height)
        context.restore()
      }

      animationFrame = window.requestAnimationFrame(drawCamera)
    }

    animationFrame = window.requestAnimationFrame(drawCamera)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [mask, media, videoRef])

  return <span className={`face-character camera-character camera-character--${body.id}`} style={{ aspectRatio: `${mask.canvasWidth} / ${mask.canvasHeight}`, '--face-x': `${mask.x}%`, '--face-y': `${mask.y}%`, '--face-width': `${mask.width}%`, '--face-height': `${mask.height}%` } as CSSProperties}>
    <canvas ref={canvasRef} className="camera-character__canvas" aria-hidden="true" />
    <img className="face-character__body" src={body.transformerAssetPath ?? body.assetPath} alt="" aria-hidden="true" draggable="false" />
    <video ref={videoRef} className="camera-character__source" autoPlay muted playsInline disablePictureInPicture aria-hidden="true" />
  </span>
}
