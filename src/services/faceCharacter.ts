import type { Character, FaceEffect, FaceMaskFamily } from '../models/types'

export const FACE_CHARACTER_ID = 'face-transformer'

export interface FaceTransform { scale: number; x: number; y: number; stretchX: number }
export interface FacePhotoSettings extends FaceTransform { effect: FaceEffect }
export interface FaceMaskPreset { family: FaceMaskFamily; x: number; y: number; width: number; height: number; viewBox: string; canvasWidth: number; canvasHeight: number; path: string }
export interface FaceMediaBox { x: number; y: number; width: number; height: number }

const DEFAULT_FACE_TRANSFORM: FaceTransform = { scale: 1, x: 0, y: 0, stretchX: 1 }
const FACE_MASK_PATHS: Record<FaceMaskFamily, { viewBox: string; canvasWidth: number; canvasHeight: number; path: string }> = {
  wide: {
    viewBox: '0 0 1078 1489',
    canvasWidth: 1078,
    canvasHeight: 1489,
    path: 'M488.672 315.723C448.572 314.677 414.647 312.262 384.42 312.684C354.173 313.106 327.55 316.366 301.993 326.694C250.873 347.353 204.153 396.229 141.094 506.758C109.566 562.019 87.0156 604.878 72.2158 639.163C57.4183 673.443 50.3511 699.193 49.8252 720.228C48.7716 762.379 73.9959 785.443 115.147 820.085C147.475 847.299 201.774 870.123 267.492 886.668C333.225 903.217 410.439 913.499 488.646 915.594C566.855 917.689 640.662 910.125 698.713 893.88C727.738 885.757 752.841 875.46 772.59 863.104C792.336 850.748 806.757 836.316 814.373 819.913C829.552 787.219 830.71 757.791 823.719 718.64C816.736 679.535 801.597 630.616 784.159 559.003C766.69 487.262 733.024 427.485 683.605 385.118C634.184 342.749 569.041 317.819 488.672 315.723Z',
  },
  frog: {
    viewBox: '0 0 1338 1338',
    canvasWidth: 1338,
    canvasHeight: 1338,
    path: 'M417.698 101.829C366.082 89.5396 312.076 111.182 263.073 148.424C213.946 185.761 201.18 235.889 207.561 287.914C213.922 339.785 239.314 393.574 266.667 438.568C239.378 467.802 214.907 493.274 202.65 525.104C190.339 557.074 190.367 595.393 211.997 650.3C224.772 682.729 245.425 703.386 272.771 716.229C300.094 729.062 334.076 734.083 373.508 735.308C412.941 736.532 457.882 733.96 507.132 731.574C556.391 729.188 609.978 726.987 666.743 728.944C723.52 730.902 779.805 735.307 832.623 738.734C885.432 742.161 934.779 744.611 977.645 742.651C1020.5 740.692 1056.94 734.323 1083.9 720.074C1110.9 705.807 1128.38 683.646 1133.3 650.189C1143.11 583.467 1123.49 539.269 1101.38 511.752C1090.33 498 1078.66 488.421 1069.76 482.28C1065.3 479.21 1061.54 476.998 1058.89 475.553C1057.56 474.83 1056.51 474.298 1055.79 473.947C1055.6 473.851 1055.42 473.771 1055.28 473.701C1055.47 473.467 1055.73 473.152 1056.05 472.758C1056.82 471.808 1057.94 470.399 1059.37 468.564C1062.21 464.894 1066.24 459.517 1070.99 452.687C1080.48 439.026 1092.86 419.545 1104.37 396.265C1127.4 349.718 1147.04 287.908 1133.3 227.039C1119.56 166.21 1090.1 132.785 1055.68 115.575C1021.29 98.3785 982.013 97.4077 948.681 101.329C915.231 105.264 881.843 126.894 850.001 156.287C818.339 185.513 788.14 222.477 760.854 257.537C742.89 220.606 699.84 206.097 657.437 208.047C636.08 209.029 614.841 214.184 596.968 222.782C579.477 231.197 565.175 242.928 557.171 257.311C518.046 160.009 469.156 114.081 417.698 101.829Z',
  },
}

const BODY_MASK_SOURCES: Record<string, { family: FaceMaskFamily; viewBox: string; canvasWidth: number; canvasHeight: number; path: string }> = {
  pig: {
    family: 'wide',
    viewBox: '0 0 1003 1386',
    canvasWidth: 1003,
    canvasHeight: 1386,
    path: 'M547.672 254.609C507.572 253.563 473.647 251.149 443.42 251.57C413.173 251.992 386.55 255.253 360.993 265.581C309.873 286.239 263.153 335.116 200.094 445.645C168.566 500.906 146.016 543.764 131.216 578.05C116.418 612.33 109.351 638.08 108.825 659.114C107.772 701.266 132.996 724.33 174.147 758.972C206.475 786.185 260.774 809.009 326.492 825.555C392.225 842.104 469.439 852.386 547.646 854.48C625.855 856.575 699.662 849.012 757.713 832.767C786.738 824.644 811.841 814.347 831.59 801.99C851.336 789.635 865.757 775.203 873.373 758.8C888.552 726.106 889.71 696.678 882.719 657.526C875.736 618.422 860.597 569.503 843.159 497.89C825.69 426.149 792.024 366.372 742.605 324.005C693.184 281.635 628.04 256.706 547.672 254.609Z',
  },
  dinosaur: {
    family: 'wide',
    viewBox: '0 0 993 1372',
    canvasWidth: 993,
    canvasHeight: 1372,
    path: 'M487.672 192.609C447.572 191.563 413.647 189.149 383.42 189.57C353.173 189.992 326.55 193.253 300.993 203.581C249.873 224.239 203.153 273.116 140.094 383.645C108.566 438.906 86.0156 481.764 71.2158 516.05C56.4182 550.33 49.3511 576.08 48.8252 597.114C47.7716 639.266 72.9959 662.33 114.147 696.972C146.475 724.185 200.774 747.009 266.492 763.555C332.225 780.104 409.439 790.386 487.646 792.48C565.855 794.575 639.662 787.012 697.713 770.767C726.738 762.644 751.841 752.347 771.59 739.99C791.336 727.635 805.757 713.203 813.373 696.8C828.552 664.106 829.71 634.678 822.719 595.526C815.736 556.422 800.597 507.503 783.159 435.89C765.69 364.149 732.024 304.372 682.605 262.005C633.184 219.635 568.04 194.706 487.672 192.609Z',
  },
}

const FACE_MASK_PLACEMENTS: Record<string, Omit<FaceMaskPreset, 'path' | 'viewBox' | 'canvasWidth' | 'canvasHeight'>> = {
  pig: { family: 'wide', x: 50, y: 50, width: 100, height: 100 },
  frog: { family: 'frog', x: 50, y: 50, width: 100, height: 100 },
  dinosaur: { family: 'wide', x: 50, y: 50, width: 100, height: 100 },
  squirrel: { family: 'wide', x: 50, y: 50, width: 100, height: 100 },
}

const FACE_MEDIA_BOXES: Record<string, FaceMediaBox> = {
  pig: { x: 108, y: 254, width: 781, height: 601 },
  frog: { x: 190, y: 89, width: 954, height: 655 },
  dinosaur: { x: 48, y: 192, width: 782, height: 601 },
  squirrel: { x: 49, y: 312, width: 781, height: 605 },
}

export function faceMaskPreset(bodyCharacterId: string, requestedFamily?: FaceMaskFamily): FaceMaskPreset {
  const placement = FACE_MASK_PLACEMENTS[bodyCharacterId]
  const family = requestedFamily ?? placement?.family ?? 'wide'
  const bodySource = BODY_MASK_SOURCES[bodyCharacterId]
  const positioned = placement && placement.family === family
    ? placement
    : { family, x: 50, y: 50, width: 100, height: 100 }
  const source = bodySource?.family === family ? bodySource : FACE_MASK_PATHS[family]
  return { ...positioned, ...source }
}

export function faceMediaBox(bodyCharacterId: string, requestedFamily?: FaceMaskFamily): FaceMediaBox {
  const exact = FACE_MEDIA_BOXES[bodyCharacterId]
  if (exact) return exact
  return requestedFamily === 'frog'
    ? FACE_MEDIA_BOXES.frog
    : FACE_MEDIA_BOXES.squirrel
}

const clamp = (value: number | undefined, min: number, max: number, fallback: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? Number(value) : fallback))

export function normalizeFaceTransform(transform?: Partial<FaceTransform>): FaceTransform {
  return {
    scale: clamp(transform?.scale, 0.65, 3.2, DEFAULT_FACE_TRANSFORM.scale),
    x: clamp(transform?.x, -35, 35, DEFAULT_FACE_TRANSFORM.x),
    y: clamp(transform?.y, -35, 35, DEFAULT_FACE_TRANSFORM.y),
    stretchX: clamp(transform?.stretchX, 0.65, 1.8, DEFAULT_FACE_TRANSFORM.stretchX),
  }
}

export function normalizeFaceEffect(effect: unknown): FaceEffect {
  void effect
  return 'none'
}

export interface FaceEffectGeometry {
  scaleX: number
  scaleY: number
  rotate: number
  skewX: number
  skewY: number
  displacement: number
  frequencyX: number
  frequencyY: number
  seed: number
}

export function faceEffectGeometry(effect: unknown): FaceEffectGeometry {
  void effect
  return { scaleX: 1, scaleY: 1, rotate: 0, skewX: 0, skewY: 0, displacement: 0, frequencyX: 0, frequencyY: 0, seed: 0 }
}

export function squareCropRect(width: number, height: number) {
  const size = Math.min(width, height)
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size }
}

export function coverCropRect(width: number, height: number, targetAspectRatio: number) {
  const sourceAspectRatio = width / height
  if (sourceAspectRatio > targetAspectRatio) {
    const cropWidth = Math.round(height * targetAspectRatio)
    return { x: Math.round((width - cropWidth) / 2), y: 0, width: cropWidth, height }
  }
  const cropHeight = Math.round(width / targetAspectRatio)
  return { x: 0, y: Math.round((height - cropHeight) / 2), width, height: cropHeight }
}

export function shouldUseNativeCamera(userAgent: string, maxTouchPoints: number) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
}

export function createFaceCharacter(body: Character, faceDataUrl: string, settings?: Partial<FacePhotoSettings>, characterId = FACE_CHARACTER_ID): Character {
  const framing = normalizeFaceTransform(settings)
  return {
    id: characterId,
    kind: 'face-mask',
    nameKey: 'transformerCharacter',
    accent: body.accent,
    assetPath: body.assetPath,
    bodyCharacterId: body.id,
    faceDataUrl,
    faceScale: framing.scale,
    faceOffsetX: framing.x,
    faceOffsetY: framing.y,
    faceStretchX: framing.stretchX,
    faceEffect: normalizeFaceEffect(settings?.effect),
  }
}

export function upsertCustomCharacter(characters: Character[], character: Character) {
  return [character, ...characters.filter((item) => item.id !== character.id)]
}

export function removeCustomCharacter(characters: Character[], selectedCharacterId: string, characterId: string, fallbackCharacterId: string) {
  return {
    characters: characters.filter((item) => item.id !== characterId),
    characterId: selectedCharacterId === characterId ? fallbackCharacterId : selectedCharacterId,
  }
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = reject
  image.src = src
})

export async function prepareFacePhoto(file: File) {
  const source = URL.createObjectURL(file)
  try {
    const image = await loadImage(source)
    const crop = squareCropRect(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 320
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas-unavailable')
    context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.78)
  } finally { URL.revokeObjectURL(source) }
}

export function captureFacePhoto(video: HTMLVideoElement, targetAspectRatio = 1) {
  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight
  if (!sourceWidth || !sourceHeight) throw new Error('camera-not-ready')
  const crop = coverCropRect(sourceWidth, sourceHeight, targetAspectRatio)
  const canvas = document.createElement('canvas')
  canvas.width = 360
  canvas.height = Math.round(canvas.width / targetAspectRatio)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas-unavailable')
  context.translate(canvas.width, 0)
  context.scale(-1, 1)
  context.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.78)
}
