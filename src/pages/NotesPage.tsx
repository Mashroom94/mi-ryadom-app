import { Heart, Lightbulb, Palette, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRef, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { PlansCalendar } from '../components/PlansCalendar'
import { SharedEnvelopeMoneyV2 } from '../components/SharedEnvelopeMoneyV2'
import { SharedPlaySheet } from '../components/SharedPlaySheet'
import { useApp } from '../context/AppContext'
import { sharedContentSummary } from '../services/sharedContentSummary'
import { notesTabAfterSwipe, type NotesTab } from '../services/notesTabs'

export function NotesPage() {
  const { state, t } = useApp()
  const [tab, setTab] = useState<NotesTab>('together')
  const swipeStart = useRef<number | null>(null)
  const counts = sharedContentSummary({
    ownIdeas: state.ideas,
    partnerIdeas: state.partnerShared?.ideas ?? [],
    ownWishes: state.wishlist,
    partnerWishes: state.partnerShared?.wishlist ?? [],
    ownPlans: state.plans,
    partnerPlans: state.partnerShared?.plans ?? [],
  })

  return (
    <div className="page-wrap notes-page" onPointerDown={(event) => {
      const target = event.target as HTMLElement
      swipeStart.current = target.closest('button, a, input, textarea, select, label, [data-no-notes-swipe]') ? null : event.clientX
    }} onPointerUp={(event) => {
      if (swipeStart.current === null) return
      setTab((current) => notesTabAfterSwipe(current, event.clientX - swipeStart.current!))
      swipeStart.current = null
    }} onPointerCancel={() => { swipeStart.current = null }}>
      <PageIntro title={t('notesTitle')} description={t('notesDescription')} />
      <div className="notes-tabs" role="tablist" aria-label={state.profile.language === 'ru' ? 'Разделы Нашего' : 'Together sections'}>
        <button type="button" className={tab === 'together' ? 'is-active' : ''} onClick={() => setTab('together')}>{state.profile.language === 'ru' ? 'Списки' : 'Lists'}</button>
        <button type="button" className={tab === 'play' ? 'is-active' : ''} onClick={() => setTab('play')}><Palette />{state.profile.language === 'ru' ? 'Развлечения' : 'Fun'}</button>
        <button type="button" className={tab === 'money' ? 'is-active' : ''} onClick={() => setTab('money')}><WalletCards />{state.profile.language === 'ru' ? 'Финансы' : 'Finances'}</button>
      </div>
      {tab === 'together' && <><PlansCalendar />
      <div className="notes-grid">
        <Link to="/ideas" className="notes-card">
          <span className="notes-card__icon"><Lightbulb aria-hidden="true" /></span>
          <span><strong>{t('ideas')}</strong><small>{t('ideasNoteHint')}</small></span>
          <b>{counts.ideas}</b>
        </Link>
        <Link to="/wishlist" className="notes-card">
          <span className="notes-card__icon"><Heart aria-hidden="true" /></span>
          <span><strong>{t('wishlist')}</strong><small>{t('wishlistNoteHint')}</small></span>
          <b>{counts.wishlist}</b>
        </Link>
      </div></>}
      {tab === 'play' && <SharedPlaySheet />}
      {tab === 'money' && <SharedEnvelopeMoneyV2 />}
    </div>
  )
}
