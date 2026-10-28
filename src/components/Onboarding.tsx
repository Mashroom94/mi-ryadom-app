import { ChevronDown, Copy, Link2, UserRound } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { useApp } from '../context/AppContext'
import { MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from '../services/displayName'
import { characters } from '../data/defaults'
import { remotePartnerService } from '../services/remotePartner'
import { nextOnboardingStep, resolveOnboardingStep, type OnboardingStep } from '../services/onboardingFlow'
import { isCompletePairCode, normalizePairCode, savePairCode } from '../services/pairCode'
import { CharacterArtwork } from './CharacterArtwork'
import { getOnboardingCharacterScale } from '../services/characterSizing'

const KEY = 'my-ryadom:onboarded-v1'
const REGISTERED_KEY = 'my-ryadom:registered-v1'
const STEP_KEY = 'my-ryadom:onboarding-step-v1'

function onboardingPreviewStep(): OnboardingStep | null {
  const value = new URLSearchParams(window.location.search).get('onboarding-preview')
  return value === 'intro' || value === 'setup' || value === 'pair' ? value : null
}

export function Onboarding() {
  const { state, t, setNames, setCustomization, setProfile, refreshPartner } = useApp()
  const [previewStep] = useState(onboardingPreviewStep)
  const [open, setOpen] = useState(() => previewStep !== null || localStorage.getItem(KEY) !== 'yes')
  const [step, setStep] = useState<OnboardingStep>(() => previewStep ?? resolveOnboardingStep(localStorage.getItem(STEP_KEY), localStorage.getItem(REGISTERED_KEY) === 'yes'))
  const [name, setName] = useState(state.user.name === 'Мария' ? '' : state.user.name)
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!open || previewStep || step !== 'pair' || localStorage.getItem(REGISTERED_KEY) !== 'yes') return
    let active = true
    const restore = async () => {
      const status = await remotePartnerService.register(state.user.name)
      if (!active || !status.available || !status.paired) return
      setConnected(true); setMessage(t('pairRestored')); await refreshPartner()
    }
    void restore()
    return () => { active = false }
  }, [open, previewStep, refreshPartner, state.user.name, step, t])

  if (!open) return null
  const selectedCharacter = characters.find((character) => character.id === state.customization.characterId) ?? characters[0]
  const selectedSizingId = selectedCharacter.bodyCharacterId ?? selectedCharacter.id
  const continueIntro = () => {
    const next = nextOnboardingStep('intro')
    if (!previewStep) localStorage.setItem(STEP_KEY, next)
    setStep(next)
  }
  const continueSetup = async () => {
    const clean = normalizeDisplayName(name)
    if (!clean) return
    if (previewStep) { setStep('pair'); return }
    setNames(clean, state.partner.name)
    try { await remotePartnerService.register(clean) } catch { /* Pairing remains available. */ }
    localStorage.setItem(REGISTERED_KEY, 'yes')
    const next = nextOnboardingStep('setup'); localStorage.setItem(STEP_KEY, next); setStep(next)
  }
  const invite = async () => {
    if (previewStep) { setCode('РЯДОМ-24'); setMessage(t('pairCodeHint')); return }
    try { const next = (await remotePartnerService.createPairCode()).code; setCode(next); savePairCode(next); setMessage(t('pairCodeHint')) } catch { setMessage(t('pairError')) }
  }
  const join = async () => {
    if (previewStep) { setConnected(true); setMessage(t('pairSuccess')); return }
    try { await remotePartnerService.joinPair(joinCode); savePairCode(joinCode); setCode(normalizePairCode(joinCode)); setConnected(true); setMessage(t('pairSuccess')); await refreshPartner() } catch { setMessage(t('pairError')) }
  }
  const copyCode = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setMessage(state.profile.language === 'ru' ? 'Код скопирован' : 'Code copied')
    } catch {
      setMessage(state.profile.language === 'ru' ? 'Не удалось скопировать код' : 'Could not copy code')
    }
  }
  const finish = () => {
    if (!previewStep) { localStorage.setItem(KEY, 'yes'); localStorage.removeItem(STEP_KEY) }
    setOpen(false)
  }

  return <div className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div className={`onboarding-card onboarding-card--${step}`}>
    <div className="onboarding-topline"><span className="onboarding-progress">{state.profile.language === 'ru' ? `Шаг ${step === 'intro' ? 1 : step === 'setup' ? 2 : 3} из 3` : `Step ${step === 'intro' ? 1 : step === 'setup' ? 2 : 3} of 3`}</span>{step === 'intro' && <label className="onboarding-language"><span className={`onboarding-language__flag onboarding-language__flag--${state.profile.language}`} aria-hidden="true" /><strong aria-hidden="true">{state.profile.language.toUpperCase()}</strong><select aria-label={state.profile.language === 'ru' ? 'Язык приложения' : 'App language'} value={state.profile.language} onChange={(event) => setProfile({ language: event.target.value === 'en' ? 'en' : 'ru' })}><option value="ru">Русский</option><option value="en">English</option></select><ChevronDown aria-hidden="true" /></label>}</div>
    {step === 'intro' ? <div className="onboarding-intro">
      <div className="onboarding-intro__brand"><img className="onboarding-intro__logo" src="/icons/app-logo.svg" alt="" aria-hidden="true" /><h1 id="onboarding-title">{state.profile.language === 'ru' ? 'Мы рядом' : 'We are close'}</h1></div>
      <p>{state.profile.language === 'ru' ? 'Приложение для двоих: создавайте забавных персонажей, взаимодействуйте с ними, делитесь настроением, тёплыми знаками, идеями и планами — даже когда вы не рядом.' : 'An app for two: create playful characters, interact with them, and share moods, warm signs, ideas, and plans even when you are apart.'}</p>
      <div className="onboarding-intro__features"><span>💜 {state.profile.language === 'ru' ? 'Один общий мир для двоих, даже если вы далеко друг от друга' : 'One shared space for two, even when you are far apart'}</span><span>✨ {state.profile.language === 'ru' ? 'Знаки внимания в одно касание' : 'A caring sign in one tap'}</span></div>
      <button className="onboarding-primary" type="button" onClick={continueIntro}>{t('continue')}</button>
    </div> : step === 'setup' ? <>
      <h1 id="onboarding-title">{state.profile.language === 'ru' ? 'Давайте познакомимся' : 'Let’s meet'}</h1><p>{state.profile.language === 'ru' ? 'Выберите персонажа.' : 'Choose your character.'}</p>
      <label className="onboarding-name"><span className="field-label-row"><span>{t('yourName')}</span><small>{state.profile.language === 'ru' ? `До ${MAX_DISPLAY_NAME_LENGTH} символов` : `Up to ${MAX_DISPLAY_NAME_LENGTH} characters`}</small></span><div><UserRound /><input autoComplete="name" autoFocus value={name} maxLength={MAX_DISPLAY_NAME_LENGTH} placeholder={t('namePlaceholder')} onChange={(event) => setName(event.target.value)} /></div></label>
      <div className="onboarding-character-preview" aria-label={t(selectedCharacter.nameKey as Parameters<typeof t>[0])}><div className="onboarding-character-preview__art is-animated" style={{ '--onboarding-character-scale': getOnboardingCharacterScale(selectedSizingId) } as CSSProperties}><CharacterArtwork character={selectedCharacter} /></div></div>
      <div className="onboarding-customize-group"><strong>{t('character')}</strong><div className="onboarding-character-picker">{characters.map((character) => {
        const selected = state.customization.characterId === character.id
        return <button key={character.id} type="button" className={selected ? 'is-selected' : ''} aria-pressed={selected} onClick={() => setCustomization({ characterId: character.id })}><img src={character.assetPath} alt="" aria-hidden="true" /><span>{t(character.nameKey as Parameters<typeof t>[0])}</span></button>
      })}</div></div>
      <p className="onboarding-customize-hint">{state.profile.language === 'ru' ? 'Больше настроек в Кастомизации.' : 'More settings in Customization.'}</p><button className="onboarding-primary" type="button" disabled={!name.trim()} onClick={() => void continueSetup()}>{t('continue')}</button>
    </> : <div className="onboarding-pair">
      <h1 id="onboarding-title">{t('invitePartner')}</h1><p>{t('inviteDescription')}</p>
      {connected && <div className="onboarding-connected"><span>✓</span><strong>{t('pairSuccess')}</strong></div>}
      {!connected && (code ? <div className="onboarding-code"><span>{t('yourPairCode')}</span><strong>{code}</strong><button type="button" aria-label={state.profile.language === 'ru' ? 'Скопировать код пары' : 'Copy pair code'} onClick={() => void copyCode()}><Copy /></button></div> : <button className="onboarding-primary onboarding-create-code" type="button" onClick={() => void invite()}><Link2 />{t('createPairCode')}</button>)}
      {!connected && <><div className="onboarding-divider"><span>{t('orEnterCode')}</span></div><div className="onboarding-join"><input inputMode="text" autoCapitalize="characters" maxLength={8} placeholder={t('enterPairCode')} value={joinCode} onChange={(event) => setJoinCode(normalizePairCode(event.target.value))} /><button type="button" disabled={!isCompletePairCode(joinCode)} onClick={() => void join()}>{t('connect')}</button></div></>}
      {message && <p className="onboarding-message">{message}</p>}
      {!connected && <p className="onboarding-pair__later-note">{state.profile.language === 'ru' ? 'Синхронизацию можно настроить позже в Настройках.' : 'You can set up synchronization later in Settings.'}</p>}
      <button className="onboarding-skip" type="button" onClick={finish}>{t('continue')}</button>
    </div>}
  </div></div>
}
