import { useEffect, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { backgrounds } from '../data/defaults'
import { useApp } from '../context/AppContext'
import type { Character, CustomizationSettings, MoodId, PartnerEvent, SignId } from '../models/types'
import { resolveDisplayedCharacter } from '../services/characterDisplay'
import { getCharacterAssetScale, getCompactCharacterOffsetY, getHomeCharacterScale } from '../services/characterSizing'
import { characterSceneRole, type HomePageId } from '../services/homePagination'
import { resolvePartnerMood, resolveUnseenCue } from '../services/partnerDisplay'
import { CharacterArtwork } from './CharacterArtwork'

const moodAssets: Record<MoodId, string> = {
  calm: '/assets/moods/mood_calm.png',
  joy: '/assets/moods/mood_happy.png',
  romance: '/assets/moods/mood_romantic.png',
  tiredness: '/assets/moods/mood_tired.png',
  sadness: '/assets/moods/mood_sad.png',
  anger: '/assets/moods/mood_angry.png',
}

const signAssets: Record<SignId, string> = {
  kiss: '/assets/signals/signal_kiss.png',
  hug: '/assets/signals/signal_hug.png',
  miss: '/assets/signals/signal_miss.png',
  support: '/assets/signals/signal_support.png',
}

export function CharacterStage({ onTouch, mode = 'partner', compact = false, suspendCues = false }: { onTouch?: () => void; mode?: 'partner' | 'self'; compact?: boolean; suspendCues?: boolean }) {
  const { state, t } = useApp()
  const [assetFailed, setAssetFailed] = useState(false)
  const [failedSceneAssets, setFailedSceneAssets] = useState<string[]>([])
  const [reacting, setReacting] = useState(false)
  const [visibleSign, setVisibleSign] = useState<PartnerEvent | null>(null)
  const [greeting, setGreeting] = useState(false)
  const [lastViewedSignId, setLastViewedSignId] = useState(() => localStorage.getItem('my-ryadom:last-sign-shown'))
  const [lastViewedTouchId, setLastViewedTouchId] = useState(() => localStorage.getItem('my-ryadom:last-touch-shown'))
  const shared = mode === 'partner' ? state.partnerShared : undefined
  const { character, customization } = resolveDisplayedCharacter(mode, state, shared)
  const ownDisplay = resolveDisplayedCharacter('self', state)
  const partnerDisplay = resolveDisplayedCharacter('partner', state, state.partnerShared)
  const sizingCharacterId = character.bodyCharacterId ?? character.id
  const background = backgrounds.find((item) => item.id === customization.backgroundId) ?? backgrounds[0]
  const motion = customization.animationEnabled && state.profile.animationsEnabled
  const visibleMood = mode === 'partner' ? resolvePartnerMood(shared, state.history) : undefined
  const unseenSign = mode === 'partner' && !suspendCues ? resolveUnseenCue(state.history, 'sign', lastViewedSignId) : null
  const unseenTouch = mode === 'partner' && !suspendCues ? resolveUnseenCue(state.history, 'touch', lastViewedTouchId) : null

  useEffect(() => setAssetFailed(false), [character.id])
  useEffect(() => {
    if (character.kind === 'glb-model') void import('@google/model-viewer')
  }, [character.kind])

  useEffect(() => {
    if (!unseenSign) return
    setVisibleSign(unseenSign)
    try { localStorage.setItem('my-ryadom:last-sign-shown', unseenSign.id) } catch { /* The in-memory view still prevents a duplicate this session. */ }
    const timer = window.setTimeout(() => {
      setVisibleSign(null)
      setLastViewedSignId(unseenSign.id)
    }, 7000)
    return () => window.clearTimeout(timer)
  }, [unseenSign])

  useEffect(() => {
    if (!unseenTouch) return
    setGreeting(true)
    try { localStorage.setItem('my-ryadom:last-touch-shown', unseenTouch.id) } catch { /* The animation still runs once in this session. */ }
    const timer = window.setTimeout(() => {
      setGreeting(false)
      setLastViewedTouchId(unseenTouch.id)
    }, 6000)
    return () => window.clearTimeout(timer)
  }, [unseenTouch])

  const triggerReaction = () => {
    setReacting(true)
    window.setTimeout(() => setReacting(false), 520)
    onTouch?.()
  }

  const react = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    triggerReaction()
  }

  const reactFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') triggerReaction()
  }

  const renderArtwork = (sceneCharacter: Character, failed: boolean, onError = () => setAssetFailed(true)) => sceneCharacter.kind === 'glb-model' && sceneCharacter.assetPath ? (
    <model-viewer className="character-model" src={sceneCharacter.assetPath} alt={sceneCharacter.name ?? t('customCharacter')} camera-controls auto-rotate interaction-prompt="none" exposure="1.1" shadow-intensity="0" />
  ) : sceneCharacter.assetPath && !failed ? (
    <CharacterArtwork character={sceneCharacter} onError={onError} />
  ) : (
    <span className="character-placeholder" aria-hidden="true"><span>{t(sceneCharacter.nameKey as Parameters<typeof t>[0])}</span></span>
  )

  const renderSceneActor = (owner: HomePageId, display: { character: Character; customization: CustomizationSettings }) => {
    const actorCharacterId = display.character.bodyCharacterId ?? display.character.id
    const role = characterSceneRole(mode, owner)
    const isForeground = role === 'foreground'
    const actorMotion = display.customization.animationEnabled && state.profile.animationsEnabled
    const isTouchablePartner = owner === 'partner' && isForeground
    return <div key={owner} className={`character-actor character-actor--${owner} is-${role}`} aria-hidden={!isForeground}>
      <button
        type="button"
        tabIndex={isForeground ? 0 : -1}
        className={`character-button character-${actorCharacterId} reaction-${display.customization.reaction}${actorMotion ? ' is-animated' : ''}${isTouchablePartner && reacting ? ' is-reacting' : ''}${isTouchablePartner && greeting ? ' is-greeting' : ''}`}
        style={{ '--character-scale': getHomeCharacterScale(display.customization.scale), '--character-asset-scale': getCharacterAssetScale(actorCharacterId), '--character-offset-y': '0%' } as React.CSSProperties}
        onPointerUp={isTouchablePartner ? react : undefined}
        onKeyUp={isTouchablePartner ? reactFromKeyboard : undefined}
        aria-label={owner === 'partner' ? t('petMe') : t(display.character.nameKey as Parameters<typeof t>[0])}
      >
        {renderArtwork(display.character, failedSceneAssets.includes(display.character.id), () => setFailedSceneAssets((current) => current.includes(display.character.id) ? current : [...current, display.character.id]))}
      </button>
    </div>
  }

  return (
    <section className={`character-stage${compact ? ' character-stage--compact' : ' character-stage--duet'} character-stage--show-${mode}`} style={{ '--stage-bg': background.color, '--character-accent': character.accent } as React.CSSProperties}>
      {!compact && mode === 'partner' && <div className="pet-hint"><span>{t('petMe')}</span><svg aria-hidden="true" viewBox="0 0 64 46"><path d="M59 3C56 12 50 17 41 22C32 28 23 32 10 35" /><path d="M10 35L20 28M10 35L20 40" /></svg></div>}
      {!compact && visibleMood && <div className="mood-bubble" aria-label={t(visibleMood)}><img src={moodAssets[visibleMood]} alt="" aria-hidden="true" /><span>{t(visibleMood)}</span></div>}
      {!compact && visibleSign && <div className="sign-bubble sign-firework" role="status" aria-label={t(visibleSign.payload as SignId)}>{Array.from({ length: 9 }, (_, index) => <img key={index} style={{ '--particle-index': index } as React.CSSProperties} src={signAssets[visibleSign.payload as SignId]} alt="" aria-hidden="true" />)}</div>}
      {!compact && greeting && <div className="touch-bubble" role="status">{t('touchReceived')}</div>}
      {compact ? <button
        type="button"
        className={`character-button character-${sizingCharacterId} reaction-${customization.reaction}${motion ? ' is-animated' : ''}${reacting ? ' is-reacting' : ''}${greeting ? ' is-greeting' : ''}`}
        style={{ '--character-scale': compact ? customization.scale : getHomeCharacterScale(customization.scale), '--character-asset-scale': getCharacterAssetScale(sizingCharacterId), '--character-offset-y': compact ? getCompactCharacterOffsetY(sizingCharacterId) : '0%' } as React.CSSProperties}
        onPointerUp={react}
        onKeyUp={reactFromKeyboard}
        aria-label={mode === 'partner' ? t('petMe') : t(character.nameKey as Parameters<typeof t>[0])}
      >{renderArtwork(character, assetFailed)}</button> : <>
        {renderSceneActor('partner', partnerDisplay)}
        {renderSceneActor('self', ownDisplay)}
      </>}
    </section>
  )
}

