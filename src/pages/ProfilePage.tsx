import { Copy, Link2, Unlink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { Switch } from '../components/ui/Switch'
import { useApp, isLanguage } from '../context/AppContext'
import { remotePartnerService } from '../services/remotePartner'
import { playCharacterSound } from '../services/characterSounds'
import { isCompletePairCode, normalizePairCode, readSavedPairCode, savePairCode } from '../services/pairCode'
import { MAX_DISPLAY_NAME_LENGTH } from '../services/displayName'

export function ProfilePage() {
  const { state, t, setProfile, setNames, refreshPartner } = useApp()
  const [userName, setUserName] = useState(state.user.name)
  const [pairCode, setPairCode] = useState(() => readSavedPairCode())
  const [joinCode, setJoinCode] = useState('')
  const [pairMessage, setPairMessage] = useState('')
  const [notificationsReady, setNotificationsReady] = useState(false)
  const [pairConnected, setPairConnected] = useState(false)
  useEffect(() => { void remotePartnerService.notificationsEnabled().then(setNotificationsReady).catch(() => undefined) }, [])
  useEffect(() => { void remotePartnerService.status().then((status) => setPairConnected(status.paired)).catch(() => undefined) }, [])
  useEffect(() => { setUserName(state.user.name) }, [state.user.name])
  const commitNames = () => setNames(userName.trim() || state.user.name, state.partner.name)
  const setSound = (soundEnabled: boolean) => {
    setProfile({ soundEnabled })
    if (soundEnabled) playCharacterSound(state.customization.characterId, state.customization.notificationSound, state.customization.customSoundDataUrl)
  }

  const createCode = async () => {
    try {
      const result = await remotePartnerService.createPairCode()
      setPairCode(result.code)
      savePairCode(result.code)
      setPairMessage(t('pairCodeHint'))
    } catch (error) { setPairMessage(error instanceof Error ? error.message : t('pairError')) }
  }

  const join = async () => {
    try {
      const status = await remotePartnerService.joinPair(joinCode)
      setPairMessage(status.paired ? t('pairSuccess') : t('pairError'))
      if (status.paired) { savePairCode(joinCode); setPairCode(normalizePairCode(joinCode)); setPairConnected(true) }
      setJoinCode('')
      await refreshPartner()
    } catch (error) { setPairMessage(error instanceof Error ? error.message : t('pairError')) }
  }

  const copyPairCode = async () => {
    if (!pairCode) return
    try { await navigator.clipboard.writeText(pairCode); setPairMessage(state.profile.language === 'ru' ? 'Код скопирован' : 'Code copied') }
    catch { setPairMessage(state.profile.language === 'ru' ? 'Не удалось скопировать код' : 'Could not copy code') }
  }

  const unlinkPair = async () => {
    if (!window.confirm(state.profile.language === 'ru' ? 'Отвязать пару на обоих телефонах?' : 'Unlink the pair on both phones?')) return
    try { await remotePartnerService.unlinkPair(); setPairConnected(false); setPairMessage(state.profile.language === 'ru' ? 'Пара отвязана. Сохранённый код можно использовать снова.' : 'Pair unlinked. The saved code can be used again.'); await refreshPartner() }
    catch (error) { setPairMessage(error instanceof Error ? error.message : t('pairError')) }
  }

  const toggleNotifications = async () => {
    try {
      if (notificationsReady) {
        await remotePartnerService.disableNotifications()
        setNotificationsReady(false)
        setPairMessage(t('notificationsDisabled'))
      } else {
        await remotePartnerService.enableNotifications()
        setNotificationsReady(true)
        setPairMessage(t('notificationsEnabled'))
      }
    } catch (error) { setPairMessage(error instanceof Error ? error.message : t('pairError')) }
  }

  return (
    <div className="page-wrap profile-page">
      <PageIntro title={t('profileTitle')} description={state.profile.language === 'ru' ? 'Настройки устройства.' : 'Device settings.'} />
      <section className="profile-card profile-card--names">
        <label><span className="field-label-row"><span>{t('yourName')}</span><small>{state.profile.language === 'ru' ? `До ${MAX_DISPLAY_NAME_LENGTH} символов` : `Up to ${MAX_DISPLAY_NAME_LENGTH} characters`}</small></span><input value={userName} maxLength={MAX_DISPLAY_NAME_LENGTH} onChange={(event) => setUserName(event.target.value)} onBlur={commitNames} /></label>
        <label><span className="field-label-row"><span>{t('partnerName')}</span><small>{pairConnected ? (state.profile.language === 'ru' ? 'Синхронизировано' : 'Synced') : (state.profile.language === 'ru' ? 'Появится после подключения' : 'Appears after pairing')}</small></span><input value={pairConnected ? state.partner.name : ''} placeholder={state.profile.language === 'ru' ? 'После подключения пары' : 'After pairing'} readOnly aria-readonly="true" /></label>
      </section>
      <section className={`pair-card${pairConnected ? ' pair-card--connected' : ''}`}>
        <div className="pair-card__heading"><span className={`pair-card__icon${state.partner.online ? ' is-online' : ''}`}><Link2 /></span><div><h2>{t('connectPhones')}</h2><p>{state.partner.online ? t('partnerConnectedOnline') : t('connectDescription')}</p></div></div>
        {pairConnected ? <><div className="pair-code pair-code--saved" aria-label={t('yourPairCode')}><span>{t('yourPairCode')}</span><strong>{pairCode || '••••••••'}</strong><button type="button" aria-label={state.profile.language === 'ru' ? 'Скопировать код пары' : 'Copy pair code'} disabled={!pairCode} onClick={() => void copyPairCode()}><Copy /></button></div><button type="button" className="unlink-pair-button" onClick={() => void unlinkPair()}><Unlink />{state.profile.language === 'ru' ? 'Отвязать пару' : 'Unlink pair'}</button></> : <div className="pair-actions">
          <button type="button" className="pair-button" onClick={() => void createCode()}>{t('createPairCode')}</button>
          <div className="pair-join"><input inputMode="text" autoCapitalize="characters" maxLength={8} value={joinCode} placeholder={t('enterPairCode')} onChange={(event) => setJoinCode(normalizePairCode(event.target.value))} /><button type="button" disabled={!isCompletePairCode(joinCode)} onClick={() => void join()}>{t('connect')}</button></div>
        </div>}
        {pairMessage && <p className="pair-message" role="status">{pairMessage}</p>}
      </section>
      <section className="profile-card">
        <label className="select-row"><span>{t('language')}</span><select value={state.profile.language} onChange={(event) => isLanguage(event.target.value) && setProfile({ language: event.target.value })}><option value="ru">{t('russian')}</option><option value="en">{t('english')}</option></select></label>
        <div className="setting-row"><span>{state.profile.language === 'ru' ? 'Уведомления' : 'Notifications'}</span><Switch label={state.profile.language === 'ru' ? 'Уведомления' : 'Notifications'} checked={notificationsReady} onChange={() => void toggleNotifications()} /></div>
        <div className="setting-row"><span>{t('sound')}</span><Switch label={t('sound')} checked={state.profile.soundEnabled} onChange={setSound} /></div>
        <div className="setting-row"><span>{t('vibration')}</span><Switch label={t('vibration')} checked={state.profile.vibrationEnabled} onChange={(vibrationEnabled) => setProfile({ vibrationEnabled })} /></div>
        <div className="setting-row"><span>{t('animations')}</span><Switch label={t('animations')} checked={state.profile.animationsEnabled} onChange={(animationsEnabled) => setProfile({ animationsEnabled })} /></div>
      </section>
      <p className="app-version">{t('version')} {__APP_VERSION__}</p>
    </div>
  )
}
