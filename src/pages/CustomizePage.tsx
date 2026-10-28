import { Camera, Check, ChevronDown, Cloud, Heart, ImagePlus, Music2, PackagePlus, RotateCcw, SlidersHorizontal, Star, Trash2, UserRound, VideoOff, Volume2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
import { PageIntro } from '../components/PageIntro'
import { CharacterStage } from '../components/CharacterStage'
import { Switch } from '../components/ui/Switch'
import { useApp } from '../context/AppContext'
import { backgrounds, characters } from '../data/defaults'
import type { CharacterSound, PhotoShape, ReactionId } from '../models/types'
import { preparePhotoAsset, readFileAsDataUrl } from '../utils/removeBackground'
import { playCharacterSound } from '../services/characterSounds'
import { assertSyncableAsset } from '../utils/assetLimits'
import { CUSTOM_SOUND_ACCEPT, validateCustomSound } from '../services/customSound'
import { rangeProgress } from '../services/rangeProgress'
import { CharacterArtwork } from '../components/CharacterArtwork'
import { CameraCharacterArtwork } from '../components/CameraCharacterArtwork'
import { captureFacePhoto, createFaceCharacter, faceMediaBox, FACE_CHARACTER_ID, prepareFacePhoto } from '../services/faceCharacter'
import { adjustPhotoZoom, createUploadedPhotoCharacter, normalizePhotoFraming, photoShapePaths } from '../services/photoShape'

const photoShapes: Array<{ id: PhotoShape; label: 'photoShapeHeart' | 'photoShapeStar' | 'photoShapeFlower' | 'photoShapeCloud'; icon?: typeof Heart }> = [
  { id: 'heart', label: 'photoShapeHeart', icon: Heart },
  { id: 'star', label: 'photoShapeStar', icon: Star },
  { id: 'flower', label: 'photoShapeFlower' },
  { id: 'cloud', label: 'photoShapeCloud', icon: Cloud },
]

export function CustomizePage({ embedded = false }: { embedded?: boolean }) {
  const { state, t, setCustomization, resetCustomization, addCustomCharacter, deleteCustomCharacter } = useApp()
  const [uploadError, setUploadError] = useState('')
  const imageInput = useRef<HTMLInputElement>(null)
  const modelInput = useRef<HTMLInputElement>(null)
  const soundInput = useRef<HTMLInputElement>(null)
  const faceInput = useRef<HTMLInputElement>(null)
  const cameraVideo = useRef<HTMLVideoElement>(null)
  const cameraStream = useRef<MediaStream | null>(null)
  const selectedCustomCharacter = state.customCharacters.find((character) => character.id === state.customization.characterId)
  const existingFaceCharacter = selectedCustomCharacter?.kind === 'face-mask'
    ? selectedCustomCharacter
    : state.customCharacters.find((character) => character.kind === 'face-mask')
  const transformerSelected = selectedCustomCharacter?.kind === 'face-mask'
  const [transformerOpen, setTransformerOpen] = useState(transformerSelected)
  const [transformerBodyId, setTransformerBodyId] = useState(existingFaceCharacter?.bodyCharacterId ?? characters[0].id)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [faceDraft, setFaceDraft] = useState(existingFaceCharacter?.faceDataUrl ?? '')
  const [faceScale, setFaceScale] = useState(existingFaceCharacter?.faceScale ?? 1)
  const [faceOffsetX, setFaceOffsetX] = useState(existingFaceCharacter?.faceOffsetX ?? 0)
  const [faceOffsetY, setFaceOffsetY] = useState(existingFaceCharacter?.faceOffsetY ?? 0)
  const [faceStretchX, setFaceStretchX] = useState(existingFaceCharacter?.faceStretchX ?? 1)
  const [faceEditorOpen, setFaceEditorOpen] = useState(false)
  const [pendingPhoto, setPendingPhoto] = useState<{ id: string; name: string; assetPath: string } | null>(null)
  const [photoShape, setPhotoShape] = useState<PhotoShape>('heart')
  const [photoScale, setPhotoScale] = useState(1)
  const [photoOffsetX, setPhotoOffsetX] = useState(0)
  const [photoOffsetY, setPhotoOffsetY] = useState(0)
  const photoFraming = useRef({ scale: 1, x: 0, y: 0 })
  const photoPointers = useRef(new Map<number, { x: number; y: number }>())
  const photoPinchDistance = useRef(0)
  const faceFraming = useRef({ scale: existingFaceCharacter?.faceScale ?? 1, x: existingFaceCharacter?.faceOffsetX ?? 0, y: existingFaceCharacter?.faceOffsetY ?? 0, stretchX: existingFaceCharacter?.faceStretchX ?? 1 })
  const facePointers = useRef(new Map<number, { x: number; y: number }>())
  const facePinchDistance = useRef(0)
  const allCharacters = [...characters, ...state.customCharacters]
  const transformerBody = characters.find((character) => character.id === transformerBodyId) ?? characters[0]
  const transformerPreview = createFaceCharacter(transformerBody, faceDraft || existingFaceCharacter?.faceDataUrl || '', { scale: faceScale, x: faceOffsetX, y: faceOffsetY, stretchX: faceStretchX })
  const pendingPhotoCharacter = pendingPhoto ? createUploadedPhotoCharacter(pendingPhoto.name, pendingPhoto.assetPath, photoShape, { scale: photoScale, x: photoOffsetX, y: photoOffsetY }, pendingPhoto.id) : null
  const photoOffsetLimit = 50
  const updatePhotoFraming = (next: { scale?: number; x?: number; y?: number }) => {
    const normalized = normalizePhotoFraming({ ...photoFraming.current, ...next })
    photoFraming.current = normalized
    setPhotoScale(normalized.scale)
    setPhotoOffsetX(normalized.x)
    setPhotoOffsetY(normalized.y)
  }

  const resetPhotoFraming = () => updatePhotoFraming({ scale: 1, x: 0, y: 0 })

  const photoDistance = () => {
    const points = [...photoPointers.current.values()]
    return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
  }

  const handlePhotoPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    photoPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (photoPointers.current.size === 2) photoPinchDistance.current = photoDistance()
  }

  const handlePhotoPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = photoPointers.current.get(event.pointerId)
    if (!previous) return
    photoPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (photoPointers.current.size >= 2) {
      const distance = photoDistance()
      if (photoPinchDistance.current > 0) updatePhotoFraming({ scale: photoFraming.current.scale * distance / photoPinchDistance.current })
      photoPinchDistance.current = distance
      return
    }
    const bounds = event.currentTarget.getBoundingClientRect()
    updatePhotoFraming({
      x: photoFraming.current.x + ((event.clientX - previous.x) / bounds.width) * 100,
      y: photoFraming.current.y + ((event.clientY - previous.y) / bounds.height) * 100,
    })
  }

  const handlePhotoPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    photoPointers.current.delete(event.pointerId)
    photoPinchDistance.current = photoPointers.current.size === 2 ? photoDistance() : 0
  }

  const handlePhotoWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    updatePhotoFraming({ scale: adjustPhotoZoom(photoFraming.current.scale, event.deltaY) })
  }

  const handlePhotoKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = 3
    const next = { ...photoFraming.current }
    if (event.key === 'ArrowLeft') next.x -= step
    else if (event.key === 'ArrowRight') next.x += step
    else if (event.key === 'ArrowUp') next.y -= step
    else if (event.key === 'ArrowDown') next.y += step
    else if (event.key === '+' || event.key === '=') next.scale += .1
    else if (event.key === '-') next.scale -= .1
    else return
    event.preventDefault()
    updatePhotoFraming(next)
  }

  const updateFaceFraming = (next: { scale?: number; x?: number; y?: number; stretchX?: number }) => {
    const merged = { ...faceFraming.current, ...next }
    const normalized = {
      scale: Math.min(3.2, Math.max(.65, merged.scale)),
      x: Math.min(35, Math.max(-35, merged.x)),
      y: Math.min(35, Math.max(-35, merged.y)),
      stretchX: Math.min(1.8, Math.max(.65, merged.stretchX)),
    }
    faceFraming.current = normalized
    setFaceScale(normalized.scale)
    setFaceOffsetX(normalized.x)
    setFaceOffsetY(normalized.y)
    setFaceStretchX(normalized.stretchX)
  }

  const faceDistance = () => {
    const points = [...facePointers.current.values()]
    return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
  }

  const handleFacePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (cameraOpen || !(faceDraft || existingFaceCharacter?.faceDataUrl)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    facePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (facePointers.current.size === 2) facePinchDistance.current = faceDistance()
  }

  const handleFacePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = facePointers.current.get(event.pointerId)
    if (!previous) return
    facePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (facePointers.current.size >= 2) {
      const distance = faceDistance()
      if (facePinchDistance.current > 0) updateFaceFraming({ scale: faceFraming.current.scale * distance / facePinchDistance.current })
      facePinchDistance.current = distance
      return
    }
    const bounds = event.currentTarget.getBoundingClientRect()
    updateFaceFraming({
      x: faceFraming.current.x + ((event.clientX - previous.x) / bounds.width) * 80,
      y: faceFraming.current.y + ((event.clientY - previous.y) / bounds.height) * 80,
    })
  }

  const handleFacePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    facePointers.current.delete(event.pointerId)
    facePinchDistance.current = facePointers.current.size === 2 ? faceDistance() : 0
  }

  const handleFaceWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (cameraOpen || !(faceDraft || existingFaceCharacter?.faceDataUrl)) return
    event.preventDefault()
    updateFaceFraming({ scale: adjustPhotoZoom(faceFraming.current.scale, event.deltaY) })
  }

  const stopCamera = () => {
    cameraStream.current?.getTracks().forEach((track) => track.stop())
    cameraStream.current = null
    if (cameraVideo.current) cameraVideo.current.srcObject = null
    setCameraOpen(false)
  }

  useEffect(() => () => {
    cameraStream.current?.getTracks().forEach((track) => track.stop())
  }, [])

  useEffect(() => {
    if (!cameraOpen || !cameraVideo.current || !cameraStream.current) return
    cameraVideo.current.srcObject = cameraStream.current
    void cameraVideo.current.play().catch(() => setCameraError(t('cameraNotReady')))
  }, [cameraOpen, t])

  const saveFace = (faceDataUrl: string) => {
    const syncedFace = assertSyncableAsset(faceDataUrl)
    setFaceDraft(syncedFace)
    setFaceScale(1)
    setFaceOffsetX(0)
    setFaceOffsetY(0)
    setFaceStretchX(1)
    faceFraming.current = { scale: 1, x: 0, y: 0, stretchX: 1 }
    setFaceEditorOpen(true)
    setTransformerOpen(true)
    setCameraError('')
  }

  const selectTransformerBody = (bodyId: string) => {
    setTransformerBodyId(bodyId)
  }

  const saveFaceFraming = () => {
    const faceDataUrl = faceDraft || existingFaceCharacter?.faceDataUrl
    if (!faceDataUrl) return
    const characterId = `${FACE_CHARACTER_ID}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    addCustomCharacter(createFaceCharacter(transformerBody, faceDataUrl, { scale: faceScale, x: faceOffsetX, y: faceOffsetY, stretchX: faceStretchX }, characterId))
    setFaceEditorOpen(false)
  }

  const handleFaceUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.type && !file.type.startsWith('image/')) { setCameraError(t('facePhotoInvalid')); return }
    if (file.size > 25 * 1024 * 1024) { setCameraError(t('facePhotoTooLarge')); return }
    try { saveFace(await prepareFacePhoto(file)) } catch { setCameraError(t('facePhotoFailed')) }
  }

  const startCamera = async () => {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError(t('cameraUnavailable')); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, audio: false })
      cameraStream.current = stream
      setCameraOpen(true)
    } catch { setCameraError(t('cameraPermissionError')) }
  }

  const takePhoto = () => {
    try {
      if (!cameraVideo.current) return
      const media = faceMediaBox(transformerBody.id, transformerBody.faceMaskFamily)
      saveFace(captureFacePhoto(cameraVideo.current, media.width / media.height))
      stopCamera()
    } catch { setCameraError(t('cameraNotReady')) }
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, kind: 'uploaded-image' | 'glb-model') => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const maxSize = kind === 'uploaded-image' ? 25 : 3
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(t('imageTooLarge'))
      return
    }
    setUploadError('')
    try {
      const name = file.name.replace(/\.[^.]+$/, '')
      if (kind === 'uploaded-image') {
        setPendingPhoto({ id: `custom-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`, name, assetPath: assertSyncableAsset(await preparePhotoAsset(file)) })
        setPhotoShape('heart')
        resetPhotoFraming()
        return
      }
      const assetPath = assertSyncableAsset(await readFileAsDataUrl(file))
      addCustomCharacter({ id: `custom-${Date.now()}`, kind, nameKey: 'customCharacter', name, accent: '#8c9be6', assetPath })
    } catch {
      setUploadError(t('uploadFailed'))
    }
  }
  const handleSoundUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validation = validateCustomSound(file)
    if (validation !== 'ok') {
      setUploadError(t(validation === 'size' ? 'customSoundTooLarge' : 'customSoundInvalid'))
      return
    }
    setUploadError('')
    try {
      setCustomization({ notificationSound: 'custom', customSoundDataUrl: await readFileAsDataUrl(file), customSoundName: file.name })
    } catch {
      setUploadError(t('uploadFailed'))
    }
  }
  return (
    <div className={`page-wrap${embedded ? ' customize-page--embedded' : ''}`}>
      {!embedded && <PageIntro title={t('customizeTitle')} description={t('customizeDescription')} />}
      {!embedded && <CharacterStage mode="self" compact />}
      {embedded && <div className="embedded-customize-intro"><h2>{t('customizeTitle')}</h2><p>{t('customizeDescription')}</p></div>}

      <section className="character-scale-panel" aria-label={t('characterScale')}>
        <label className="range-row range-row--standalone">
          <span>{t('characterScale')} <strong>{Math.round(state.customization.scale * 100)}%</strong></span>
          <input type="range" min="0.5" max="1" step="0.01" value={state.customization.scale} style={{ '--range-progress': `${rangeProgress(state.customization.scale, 0.5, 1)}%` } as React.CSSProperties} onChange={(event) => setCustomization({ scale: Number(event.target.value) })} />
        </label>
      </section>

      <section className="settings-section character-options-section">
        <h2>{t('character')}</h2>
        <div className="character-picker">
          {allCharacters.map((character) => {
            const selected = state.customization.characterId === character.id
            return (
              <div className="character-option-wrap" key={character.id}>
                <button type="button" className={`character-option character-option--${character.id}${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={() => setCustomization({ characterId: character.id })} style={{ '--swatch': character.accent } as React.CSSProperties}>
                  {character.kind === 'glb-model' ? <PackagePlus aria-hidden="true" /> : <CharacterArtwork character={character} />}
                  <span>{character.name ?? t(character.nameKey as Parameters<typeof t>[0])}</span>{selected && <span className="sr-only">✓</span>}
                </button>
                {!characters.some((preset) => preset.id === character.id) && <button type="button" className="character-delete" aria-label={t('deleteCustomCharacter')} onClick={() => deleteCustomCharacter(character.id)}><Trash2 aria-hidden="true" /></button>}
              </div>
            )
          })}
          <button type="button" className="character-upload" onClick={() => modelInput.current?.click()}><PackagePlus aria-hidden="true" /><span>{t('addGlb')}</span><small>GLB · 3D</small></button>
          <label className="character-upload character-upload--label" htmlFor="character-photo-input"><ImagePlus aria-hidden="true" /><span>{t('uploadImage')}</span><small>Фото с устройства</small></label>
        </div>
        <input id="character-photo-input" ref={imageInput} className="mobile-file-input" type="file" accept="image/*,.heic,.heif" onChange={(event) => void handleUpload(event, 'uploaded-image')} />
        <input ref={modelInput} className="sr-only" type="file" accept=".glb,model/gltf-binary" onChange={(event) => void handleUpload(event, 'glb-model')} />
        {pendingPhotoCharacter && <div className="photo-shape-editor" aria-labelledby="photo-shape-title">
          <div
            className="photo-shape-editor__preview"
            role="group"
            tabIndex={0}
            aria-label={t('photoCropArea')}
            onPointerDown={handlePhotoPointerDown}
            onPointerMove={handlePhotoPointerMove}
            onPointerUp={handlePhotoPointerEnd}
            onPointerCancel={handlePhotoPointerEnd}
            onWheel={handlePhotoWheel}
            onKeyDown={handlePhotoKeyDown}
          ><CharacterArtwork character={pendingPhotoCharacter} /></div>
          <div><h3 id="photo-shape-title">{t('choosePhotoShape')}</h3><p>{t('choosePhotoShapeHint')}</p></div>
          <div className="photo-shape-editor__controls">
            <label><span>{t('photoZoom')} <strong>{Math.round(photoScale * 100)}%</strong></span><input type="range" min="0.65" max="4" step="0.02" value={photoScale} onChange={(event) => updatePhotoFraming({ scale: Number(event.target.value) })} /></label>
            <label><span>{t('photoHorizontal')}</span><input type="range" min={-photoOffsetLimit} max={photoOffsetLimit} step="1" value={photoOffsetX} onChange={(event) => updatePhotoFraming({ x: Number(event.target.value) })} /></label>
            <label><span>{t('photoVertical')}</span><input type="range" min={-photoOffsetLimit} max={photoOffsetLimit} step="1" value={photoOffsetY} onChange={(event) => updatePhotoFraming({ y: Number(event.target.value) })} /></label>
          </div>
          <div className="photo-shape-picker" role="group" aria-label={t('choosePhotoShape')}>
            {photoShapes.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={photoShape === id ? 'is-selected' : ''} aria-pressed={photoShape === id} onClick={() => setPhotoShape(id)}>{Icon ? <Icon aria-hidden="true" /> : <svg viewBox="0 0 100 100" aria-hidden="true"><path d={photoShapePaths.flower[0]} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>}<span>{t(label)}</span></button>)}
          </div>
          <div className="photo-shape-editor__actions"><button type="button" className="transformer-action transformer-action--primary" onClick={() => { addCustomCharacter(pendingPhotoCharacter); setPendingPhoto(null) }}><Check aria-hidden="true" />{t('addPhotoCharacter')}</button><button type="button" className="transformer-action" onClick={() => setPendingPhoto(null)}>{t('cancel')}</button></div>
        </div>}
        <button type="button" className={`character-transformer-row${transformerSelected ? ' is-selected' : ''}${transformerOpen ? ' is-open' : ''}`} aria-pressed={transformerSelected} aria-expanded={transformerOpen} onClick={() => { setTransformerOpen((open) => !open); if (existingFaceCharacter) setCustomization({ characterId: existingFaceCharacter.id }) }}>
          {existingFaceCharacter ? <CharacterArtwork character={existingFaceCharacter} /> : <UserRound aria-hidden="true" />}
          <span className="character-transformer__copy"><strong>{t('transformerCharacter')}</strong><small>{t('facePhoto')}</small></span>
          <ChevronDown className="character-transformer__chevron" aria-hidden="true" />
        </button>
        {uploadError && <p className="form-error" role="alert">{uploadError}</p>}
      </section>

      {transformerOpen && <section className="transformer-builder" aria-labelledby="transformer-title">
        <div className="transformer-builder__heading">
          <div><h2 id="transformer-title">{t('transformerTitle')}</h2><p>{t('transformerDescription')}</p></div>
          <button type="button" className="transformer-cancel" aria-label={t('cancel')} title={t('cancel')} onClick={() => { stopCamera(); setTransformerOpen(false); setFaceEditorOpen(false) }}><X aria-hidden="true" /></button>
        </div>
        <div className={`transformer-preview${cameraOpen ? ' is-camera-open' : ''}${!cameraOpen && (faceDraft || existingFaceCharacter?.faceDataUrl) ? ' is-adjustable' : ''}`} tabIndex={!cameraOpen && (faceDraft || existingFaceCharacter?.faceDataUrl) ? 0 : undefined} aria-label={!cameraOpen && (faceDraft || existingFaceCharacter?.faceDataUrl) ? (state.profile.language === 'ru' ? 'Перемещайте фото одним пальцем, масштабируйте двумя' : 'Drag with one finger and pinch with two') : undefined} onPointerDown={handleFacePointerDown} onPointerMove={handleFacePointerMove} onPointerUp={handleFacePointerEnd} onPointerCancel={handleFacePointerEnd} onWheel={handleFaceWheel}>
          {cameraOpen
            ? <CameraCharacterArtwork body={transformerBody} videoRef={cameraVideo} />
            : <CharacterArtwork character={transformerPreview} />}
        </div>
        {cameraOpen && <div className="transformer-actions transformer-actions--camera">
          <button type="button" className="transformer-action transformer-action--primary" onClick={takePhoto}><Camera aria-hidden="true" />{t('takePhoto')}</button>
          <button type="button" className="transformer-action" onClick={stopCamera}><VideoOff aria-hidden="true" />{t('cancel')}</button>
        </div>}
        <p className="transformer-body-label">{t('chooseBody')}</p>
        <div className="transformer-body-picker" role="group" aria-label={t('chooseBody')}>
          {characters.map((body) => <button key={body.id} type="button" className={transformerBodyId === body.id ? 'is-selected' : ''} aria-pressed={transformerBodyId === body.id} aria-label={t(body.nameKey as Parameters<typeof t>[0])} onClick={() => selectTransformerBody(body.id)}><img src={body.assetPath} alt="" aria-hidden="true" /></button>)}
        </div>
        {!cameraOpen && (faceDraft || existingFaceCharacter?.faceDataUrl) && <div className="face-editor">
          <button className="face-editor__toggle" type="button" aria-expanded={faceEditorOpen} onClick={() => setFaceEditorOpen((open) => !open)}><SlidersHorizontal aria-hidden="true" />{t('editFacePhoto')}<ChevronDown className={faceEditorOpen ? 'is-open' : ''} aria-hidden="true" /></button>
          {faceEditorOpen && <div className="face-editor__controls">
            <label><span>{t('faceZoom')} <strong>{Math.round(faceScale * 100)}%</strong></span><input type="range" min="0.65" max="3.2" step="0.02" value={faceScale} onChange={(event) => updateFaceFraming({ scale: Number(event.target.value) })} /></label>
            <label><span>{t('faceHorizontal')}</span><input type="range" min="-35" max="35" step="1" value={faceOffsetX} onChange={(event) => updateFaceFraming({ x: Number(event.target.value) })} /></label>
            <label><span>{t('faceVertical')}</span><input type="range" min="-35" max="35" step="1" value={faceOffsetY} onChange={(event) => updateFaceFraming({ y: Number(event.target.value) })} /></label>
            <label><span>{state.profile.language === 'ru' ? 'Растянуть в ширину' : 'Stretch width'}</span><input type="range" min="0.65" max="1.8" step="0.01" value={faceStretchX} onChange={(event) => updateFaceFraming({ stretchX: Number(event.target.value) })} /></label>
            <button className="transformer-action transformer-action--primary" type="button" onClick={saveFaceFraming}>{t('saveFacePosition')}</button>
          </div>}
        </div>}
        {!cameraOpen && <div className="transformer-actions">
          <button type="button" className="transformer-action transformer-action--primary" onClick={() => void startCamera()}><Camera aria-hidden="true" />{t('openCamera')}</button>
          <label className="transformer-action transformer-action--file" htmlFor="face-gallery-input"><ImagePlus aria-hidden="true" />{existingFaceCharacter ? t('replaceFacePhoto') : t('chooseFacePhoto')}</label>
        </div>}
        <input id="face-gallery-input" ref={faceInput} className="mobile-file-input" type="file" accept="image/*,.heic,.heif" onChange={(event) => void handleFaceUpload(event)} />
        {cameraError && <p className="form-error" role="alert">{cameraError}</p>}
      </section>}

      <section className="settings-section">
        <h2>{t('background')}</h2>
        <div className="background-picker">
          {backgrounds.map((background) => {
            const selected = state.customization.backgroundId === background.id
            return <button key={background.id} type="button" aria-label={`${t('background')} ${background.id}`} aria-pressed={selected} className={selected ? 'is-selected' : ''} style={{ backgroundColor: background.color }} onClick={() => setCustomization({ backgroundId: background.id })}>{selected && '✓'}</button>
          })}
        </div>
      </section>

      <section className="settings-section control-list">
        <div className="setting-row"><span>{t('lightAnimation')}</span><Switch label={t('lightAnimation')} checked={state.customization.animationEnabled} onChange={(animationEnabled) => setCustomization({ animationEnabled })} /></div>
        <label className="select-row"><span>{t('tapReaction')}</span><select value={state.customization.reaction} onChange={(event) => setCustomization({ reaction: event.target.value as ReactionId })}><option value="bounce">{t('bounce')}</option><option value="sway">{t('sway')}</option><option value="pulse">{t('pulse')}</option></select></label>
        <label className="select-row"><span>{t('characterSound')}</span><select value={state.customization.notificationSound} onChange={(event) => setCustomization({ notificationSound: event.target.value as CharacterSound })}><option value="character">{t('soundByCharacter')}</option><option value="grunt">{t('pigGrunt')}</option><option value="croak">{t('frogCroak')}</option><option value="chime">{t('softChime')}</option>{state.customization.customSoundDataUrl && <option value="custom">{t('customSound')}</option>}<option value="silent">{t('silent')}</option></select></label>
        <button className="custom-sound-upload" type="button" onClick={() => soundInput.current?.click()}><Music2 /><span><strong>{state.customization.customSoundDataUrl ? t('replaceCustomSound') : t('addCustomSound')}</strong>{state.customization.customSoundName && <small>{state.customization.customSoundName}</small>}<small>{t('customSoundFormats')}</small></span></button>
        <input ref={soundInput} className="sr-only" type="file" accept={CUSTOM_SOUND_ACCEPT} onChange={(event) => void handleSoundUpload(event)} />
        <button className="sound-preview" type="button" onClick={() => playCharacterSound(state.customization.characterId, state.customization.notificationSound, state.customization.customSoundDataUrl)}><Volume2 />{t('testSound')}</button>
      </section>

      <button className="secondary-button" type="button" onClick={resetCustomization}><RotateCcw />{t('resetDefaults')}</button>
    </div>
  )
}

