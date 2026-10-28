import { Check, Palette, Settings, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BottomSheet } from '../components/BottomSheet'
import { CharacterStage } from '../components/CharacterStage'
import { StickerArtwork } from '../components/StickerArtwork'
import { Toast } from '../components/Toast'
import { useApp } from '../context/AppContext'
import { characters } from '../data/defaults'
import type { DrawingStroke, MoodId, SharedDrawing, SignId } from '../models/types'
import { deliveryFeedbackKey } from '../services/deliveryFeedback'
import { isHomeSwipeSurface, pageAfterSwipe, resolveHomePage, shouldCelebrateStickerDelivery, type HomePageId } from '../services/homePagination'
import { homeMoodOrder } from '../services/homeMoodOrder'
import { localPartnerEventService } from '../services/partnerEvents'
import { drawingIdFromEvent, isMoneyUpdatedEvent, isTicInviteEvent, isTicTurnEvent, latestReceivedEventId, receivedEventLabelKey, resolveUnseenCue, resolveUnseenDrawing } from '../services/partnerDisplay'
import { archiveDrawing, prepareDrawingReply } from '../services/sharedTools'
import { canSendSelectedSign } from '../services/signComposer'
import { shouldSendTouch } from '../services/touchThrottle'
import { CustomizePage } from './CustomizePage'

const moodIcons: Record<MoodId, string> = { calm: '/assets/moods/mood_calm.png', joy: '/assets/moods/mood_happy.png', romance: '/assets/moods/mood_romantic.png', tiredness: '/assets/moods/mood_tired.png', sadness: '/assets/moods/mood_sad.png', anger: '/assets/moods/mood_angry.png' }
const moods = homeMoodOrder.map((id) => ({ id, icon: moodIcons[id] }))
const signs = [
  { id: 'kiss', icon: '/assets/signals/signal_kiss.png' }, { id: 'hug', icon: '/assets/signals/signal_hug.png' },
  { id: 'miss', icon: '/assets/signals/signal_miss.png' }, { id: 'support', icon: '/assets/signals/signal_support.png' },
] as const
const stickers = [
  { id: 'warmth', key: 'stickerWarmth', badge: '💗' }, { id: 'smile', key: 'stickerSmile', badge: '😊' },
  { id: 'star', key: 'stickerStar', badge: '🏆' }, { id: 'laugh', key: 'stickerLaugh', badge: '😄' },
] as const

export function HomePage() {
  const { state, t, setMood, addEvent, updateSharedBoard } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = resolveHomePage(`?${searchParams.toString()}`)
  const [sendingSign, setSendingSign] = useState<SignId | null>(null)
  const [selectedSign, setSelectedSign] = useState<SignId | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deliveredSticker, setDeliveredSticker] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const [toastMessage, setToastMessage] = useState(t('signSent'))
  const [incomingSticker, setIncomingSticker] = useState<string | null>(null)
  const [incomingDrawing, setIncomingDrawing] = useState<SharedDrawing | null>(null)
  const [incomingDrawingStrokes, setIncomingDrawingStrokes] = useState<DrawingStroke[]>([])
  const [incomingDraft, setIncomingDraft] = useState<DrawingStroke | null>(null)
  const [incomingColor, setIncomingColor] = useState('#6475dc')
  const [lastViewedStickerId, setLastViewedStickerId] = useState(() => localStorage.getItem('my-ryadom:last-sticker-shown'))
  const [lastViewedDrawingId, setLastViewedDrawingId] = useState(() => localStorage.getItem('my-ryadom:last-drawing-shown'))
  const lastReceivedId = useRef<string | null>(latestReceivedEventId(state.history))
  const lastTouchSentAt = useRef<number | null>(null)
  const swipeStart = useRef<number | null>(null)
  const incomingSvgRef = useRef<SVGSVGElement>(null)
  const ownCharacter = [...characters, ...state.customCharacters].find((item) => item.id === state.customization.characterId) ?? characters[0]
  const partnerCharacters = [...characters, ...(state.partnerShared?.customCharacters ?? [])]
  const partnerCharacter = partnerCharacters.find((item) => item.id === state.partnerShared?.customization.characterId) ?? characters[0]
  const unseenSticker = resolveUnseenCue(state.history, 'sticker', lastViewedStickerId)
  const unseenDrawing = resolveUnseenDrawing(state.history, lastViewedDrawingId)

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(false), 5500); return () => window.clearTimeout(timer) }, [toast])
  useEffect(() => {
    const received = state.history.find((event) => event.direction === 'received')
    if (!received || received.id === lastReceivedId.current || incomingDrawing) return
    lastReceivedId.current = received.id
    if (received.type === 'sticker' || received.type === 'touch') return
    if (drawingIdFromEvent(received)) {
      setToastMessage(state.profile.language === 'ru' ? 'Вам отправили рисунок' : 'You received a drawing'); setToast(true); return
    }
    if (isTicInviteEvent(received)) {
      setToastMessage(state.profile.language === 'ru' ? 'Ваш ход в крестики-нолики' : 'Your turn in tic-tac-toe'); setToast(true); return
    }
    if (isTicTurnEvent(received)) {
      setToastMessage(state.profile.language === 'ru' ? 'Ваш ход в крестики-нолики' : 'Your turn in tic-tac-toe'); setToast(true); return
    }
    if (isMoneyUpdatedEvent(received)) {
      setToastMessage(state.profile.language === 'ru' ? 'В финансы внесены изменения' : 'Finances were updated'); setToast(true); return
    }
    setToastMessage(`${state.partner.name}: ${t(receivedEventLabelKey(received))}`); setToast(true)
  }, [incomingDrawing, state.history, state.partner.name, state.profile.language, t])
  useEffect(() => {
    if (!unseenSticker || incomingDrawing) return
    setIncomingSticker(unseenSticker.payload)
    try { localStorage.setItem('my-ryadom:last-sticker-shown', unseenSticker.id) } catch { /* Session state is enough. */ }
    const timer = window.setTimeout(() => { setIncomingSticker(null); setLastViewedStickerId(unseenSticker.id) }, 6000)
    return () => window.clearTimeout(timer)
  }, [incomingDrawing, unseenSticker])
  useEffect(() => {
    if (!unseenDrawing) return
    const drawingId = drawingIdFromEvent(unseenDrawing)
    const drawing = state.partnerShared?.sharedBoard?.savedDrawings?.find((item) => item.id === drawingId)
    if (!drawing) return
    setIncomingDrawing(drawing)
    setIncomingDrawingStrokes(drawing.strokes.map((stroke) => ({ ...stroke, points: stroke.points.map((point) => ({ ...point })) })))
  }, [state.partnerShared?.sharedBoard?.savedDrawings, unseenDrawing])

  const closeIncomingDrawing = () => {
    if (unseenDrawing) {
      try { localStorage.setItem('my-ryadom:last-drawing-shown', unseenDrawing.id) } catch { /* Session state is enough. */ }
      setLastViewedDrawingId(unseenDrawing.id)
    }
    setIncomingDrawing(null); setIncomingDraft(null)
  }
  const incomingPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = incomingSvgRef.current!.getBoundingClientRect()
    return { x: Math.max(0, Math.min(1000, (event.clientX - rect.left) / rect.width * 1000)), y: Math.max(0, Math.min(600, (event.clientY - rect.top) / rect.height * 600)) }
  }
  const beginIncomingStroke = (event: React.PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setIncomingDraft({ id: crypto.randomUUID(), color: incomingColor, width: 10, points: [incomingPoint(event)] })
  }
  const moveIncomingStroke = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!incomingDraft) return
    const next = incomingPoint(event)
    setIncomingDraft((current) => current ? { ...current, points: [...current.points, next] } : null)
  }
  const finishIncomingStroke = () => {
    if (!incomingDraft) return
    setIncomingDrawingStrokes((current) => [...current, incomingDraft]); setIncomingDraft(null)
  }
  const replyToDrawing = () => {
    if (!incomingDrawing) return
    const drawingId = crypto.randomUUID()
    const reply = prepareDrawingReply(state.sharedBoard, { ...incomingDrawing, strokes: incomingDrawingStrokes })
    updateSharedBoard(archiveDrawing(reply, drawingId), `drawing:${drawingId}`)
    closeIncomingDrawing()
  }

  const selectPage = (next: HomePageId) => setSearchParams(next === 'self' ? { page: 'me' } : {}, { replace: true })
  const send = async (type: 'sign' | 'sticker' | 'touch', payload: string, eventId?: string) => {
    try {
      const event = await localPartnerEventService.send(type, payload, eventId); addEvent(event)
      if (event.status === 'failed') throw new Error('send failed')
      if (state.profile.vibrationEnabled) navigator.vibrate?.(18)
      setToastMessage(t(deliveryFeedbackKey(type, event.status === 'queued' ? 'queued' : 'sent'))); setToast(true)
      return event.status === 'queued' ? 'queued' as const : 'sent' as const
    } catch { setToastMessage(t('sendFailed')); setToast(true); return 'failed' as const }
  }
  const sendSelectedSign = async () => {
    if (!canSendSelectedSign(selectedSign, Boolean(sendingSign)) || !selectedSign) return
    setSendingSign(selectedSign); await send('sign', selectedSign, crypto.randomUUID()); setSendingSign(null); setSelectedSign(null)
  }
  const sendSticker = async (id: string) => {
    const result = await send('sticker', id)
    if (shouldCelebrateStickerDelivery(result)) {
      setDeliveredSticker(id); window.setTimeout(() => { setDeliveredSticker(null); setSheetOpen(false) }, 760)
    } else setSheetOpen(false)
  }
  const sendTouch = () => { const now = Date.now(); if (!shouldSendTouch(lastTouchSentAt.current, now)) return; lastTouchSentAt.current = now; void send('touch', 'character-touch') }
  const chooseMood = (mood: MoodId) => { setMood(mood); setToastMessage(t('partnerKnowsMood')); setToast(true) }

  return <div className={`home-page home-page--${page}`} onPointerDown={(event) => {
    const target = event.target as HTMLElement
    const insideInteractiveControl = Boolean(target.closest('a, button, input, label, select, textarea, [contenteditable="true"], [data-no-home-swipe]'))
    swipeStart.current = isHomeSwipeSurface(target.tagName, target.isContentEditable) && !insideInteractiveControl
      ? event.clientX
      : null
  }} onPointerUp={(event) => {
    if (swipeStart.current === null) return
    const next = pageAfterSwipe(page, event.clientX - swipeStart.current); swipeStart.current = null
    if (next !== page) selectPage(next)
  }} onPointerCancel={() => { swipeStart.current = null }}>
    <h1 className="sr-only">{t('appName')}</h1>
    <header className="home-header"><Link className="home-profile-button" to="/profile" aria-label={t('openProfile')}><Settings aria-hidden="true" /></Link><div className="home-header__actions"><button type="button" className="header-sticker-button" onClick={() => setSheetOpen(true)}><span className="header-sticker-artwork"><StickerArtwork character={ownCharacter} /></span><span>{t('stickers')}</span></button></div></header>
    <CharacterStage mode={page} onTouch={page === 'partner' ? sendTouch : undefined} suspendCues={Boolean(incomingDrawing)} />
    <div className="character-pagination" role="tablist" aria-label={state.profile.language === 'ru' ? 'Персонажи' : 'Characters'}>
      <button type="button" role="tab" aria-selected={page === 'partner'} className={page === 'partner' ? 'is-active' : ''} onClick={() => selectPage('partner')}>{state.partner.name}</button>
      <button type="button" role="tab" aria-selected={page === 'self'} className={page === 'self' ? 'is-active' : ''} onClick={() => selectPage('self')}>{state.profile.language === 'ru' ? 'Я' : 'Me'}</button>
    </div>
    {page === 'partner' ? <div className="home-content">
      <section className="home-section"><h2>{state.profile.language === 'ru' ? 'Моё настроение' : 'My mood'}</h2><div className="option-grid option-grid--mood">{moods.map(({ id, icon }) => { const selected = state.mood === id; return <button key={id} type="button" className={`choice-card${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={() => chooseMood(id)}><span className={`choice-asset-frame choice-asset-frame--${id}`} aria-hidden="true"><img className={`choice-asset choice-asset--mood choice-asset--${id}`} src={icon} alt="" /></span><span>{t(id)}</span>{selected && <Check className="choice-check" aria-hidden="true" />}</button> })}</div></section>
      <section className="home-section"><h2>{state.profile.language === 'ru' ? 'Знак для партнёра' : 'A sign for your partner'}</h2><div className="option-grid option-grid--sign">{signs.map(({ id, icon }) => { const selected = selectedSign === id; return <button key={id} type="button" className={`choice-card${selected ? ' is-selected' : ''}`} aria-pressed={selected} disabled={Boolean(sendingSign)} onClick={() => setSelectedSign(id)}><span className="choice-asset-frame choice-asset-frame--signal" aria-hidden="true"><img className={`choice-asset choice-asset--signal choice-asset--${id}`} src={icon} alt="" /></span><span>{t(id)}</span>{selected && <Check className="choice-check" aria-hidden="true" />}</button> })}</div><button className="pair-button send-button compact-sign-send is-idle" type="button" disabled={!canSendSelectedSign(selectedSign, Boolean(sendingSign))} aria-busy={Boolean(sendingSign)} onClick={() => void sendSelectedSign()}>{sendingSign ? t('sendingSign') : t('sendSign')}</button></section>
    </div> : <div className="home-content home-content--customize"><CustomizePage embedded /></div>}
    <BottomSheet open={sheetOpen} title={state.profile.language === 'ru' ? 'Отправить партнёру' : 'Send to your partner'} closeLabel={t('close')} onClose={() => setSheetOpen(false)}><div className="sticker-grid">{stickers.map(({ id, key, badge }) => <button key={id} type="button" className={deliveredSticker === id ? 'is-delivered' : ''} disabled={Boolean(deliveredSticker)} onClick={() => void sendSticker(id)}><span className="sticker-character"><StickerArtwork character={ownCharacter} /><b aria-hidden="true">{badge}</b></span><span>{t(key)}</span></button>)}</div></BottomSheet>
    <Toast message={toastMessage} visible={toast} />
    {incomingSticker && <div className="incoming-sticker" role="status" aria-label={t('newSticker')}><div className="incoming-sticker__card"><span className="incoming-sticker__visual"><StickerArtwork character={partnerCharacter} /><b aria-hidden="true">{stickers.find((item) => item.id === incomingSticker)?.badge}</b></span></div></div>}
    {incomingDrawing && <div className="incoming-drawing" role="dialog" aria-modal="true" aria-labelledby="incoming-drawing-title" data-no-home-swipe><div className="incoming-drawing__card"><div className="incoming-drawing__heading"><p id="incoming-drawing-title">{state.profile.language === 'ru' ? `Рисунок от ${state.partner.name}` : `Drawing from ${state.partner.name}`}</p><button type="button" autoFocus onClick={closeIncomingDrawing} aria-label={state.profile.language === 'ru' ? 'Закрыть рисунок' : 'Close drawing'}><X /></button></div><div className="incoming-drawing__paper"><svg ref={incomingSvgRef} viewBox="0 0 1000 600" aria-label={state.profile.language === 'ru' ? 'Дорисовать рисунок пальцем или стилусом' : 'Continue the drawing with a finger or stylus'} onPointerDown={beginIncomingStroke} onPointerMove={moveIncomingStroke} onPointerUp={finishIncomingStroke} onPointerCancel={() => setIncomingDraft(null)}>{[...incomingDrawingStrokes, ...(incomingDraft ? [incomingDraft] : [])].map((stroke) => <polyline key={stroke.id} points={stroke.points.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" />)}</svg></div><p className="incoming-drawing__hint">{state.profile.language === 'ru' ? 'Можно дорисовать' : 'You can add to the drawing'}</p><div className="incoming-drawing__tools"><label><input type="color" value={incomingColor} onChange={(event) => setIncomingColor(event.target.value)} aria-label={state.profile.language === 'ru' ? 'Цвет для дорисовки' : 'Reply drawing color'} /><Palette aria-hidden="true" /><span>{state.profile.language === 'ru' ? 'Цвет' : 'Color'}</span></label><button type="button" onClick={replyToDrawing}>{state.profile.language === 'ru' ? 'Отправить' : 'Send'}</button></div></div></div>}
  </div>
}
