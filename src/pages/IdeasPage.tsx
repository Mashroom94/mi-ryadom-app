import { Bookmark, BookmarkCheck, CalendarDays, Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'
import type { IdeaCategory } from '../models/types'
import { groupIdeasForView } from '../services/ideasView'
import { displayIdeaCategory, ideaMatchesFilter, visibleIdeaCategories, type VisibleIdeaCategory } from '../services/ideaCategories'

const IDEAS_UI_KEY = 'my-ryadom:ideas-ui-v1'
const ideaCategories = new Set<IdeaCategory>(['home', 'outside', 'experience'])

interface IdeasUiState {
  filter: 'all' | VisibleIdeaCategory
  view: 'added' | 'suggested'
  formOpen: boolean
  title: string
  description: string
  category: IdeaCategory
}

const loadIdeasUi = (): IdeasUiState => {
  const fallback: IdeasUiState = { filter: 'all', view: 'added', formOpen: false, title: '', description: '', category: 'home' }
  try {
    const parsed = JSON.parse(localStorage.getItem(IDEAS_UI_KEY) || '{}') as Partial<IdeasUiState>
    const filter = visibleIdeaCategories.includes(parsed.filter as typeof visibleIdeaCategories[number]) ? parsed.filter as 'all' | VisibleIdeaCategory : fallback.filter
    const category = ideaCategories.has(parsed.category as IdeaCategory) ? parsed.category as IdeaCategory : fallback.category
    const view = parsed.view === 'suggested' ? 'suggested' : 'added'
    return { filter, view, category, formOpen: Boolean(parsed.formOpen), title: parsed.title ?? '', description: parsed.description ?? '' }
  } catch { return fallback }
}

export function IdeasPage() {
  const { state, t, toggleIdea, addIdea, deleteIdea, addPlan, deletePlan, togglePlan } = useApp()
  const [initialUi] = useState(loadIdeasUi)
  const [filter, setFilter] = useState<'all' | VisibleIdeaCategory>(initialUi.filter)
  const [view, setView] = useState<'added' | 'suggested'>(initialUi.view)
  const [formOpen, setFormOpen] = useState(initialUi.formOpen)
  const [title, setTitle] = useState(initialUi.title)
  const [description, setDescription] = useState(initialUi.description)
  const [category, setCategory] = useState<IdeaCategory>(initialUi.category)
  const [planTitle, setPlanTitle] = useState('')
  const [planDate, setPlanDate] = useState('')
  const groupedIdeas = groupIdeasForView(state.ideas, state.partnerShared?.ideas ?? [])
  const shown = groupedIdeas[view].filter(({ idea }) => ideaMatchesFilter(idea.category, filter))
  const partnerPlans = state.partnerShared?.plans ?? []
  const allPlans = [
    ...state.plans.map((plan) => ({ plan, partner: false })),
    ...partnerPlans.map((plan) => ({ plan, partner: true })),
  ].sort((left, right) => left.plan.date.localeCompare(right.plan.date))
  useEffect(() => {
    try { localStorage.setItem(IDEAS_UI_KEY, JSON.stringify({ filter, view, formOpen, title, description, category })) } catch { /* Keep the current form usable. */ }
  }, [category, description, filter, formOpen, title, view])
  const submit = () => {
    if (!title.trim()) return
    addIdea({ title: title.trim(), description: description.trim(), category })
    setTitle('')
    setDescription('')
    setFormOpen(false)
  }
  return (
    <div className="page-wrap">
      <PageIntro title={t('ideasTitle')} description={t('ideasDescription')} action={<button className="compact-action" type="button" onClick={() => setFormOpen((open) => !open)}><Plus />{t('addIdea')}</button>} />
      {formOpen && <form className="idea-form" onSubmit={(event) => { event.preventDefault(); submit() }}>
        <label><span>{t('newIdeaTitle')}</span><input required value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label><span>{t('newIdeaDescription')}</span><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label><span>{t('wishCategory')}</span><select value={category} onChange={(event) => setCategory(event.target.value as IdeaCategory)}>{visibleIdeaCategories.filter((item): item is VisibleIdeaCategory => item !== 'all').map((item) => <option key={item} value={item}>{t(item === 'home' ? 'homeCategory' : item)}</option>)}</select></label>
        <div className="form-actions"><button className="text-button" type="button" onClick={() => setFormOpen(false)}>{t('cancel')}</button><button className="primary-small" type="submit">{t('createIdea')}</button></div>
      </form>}
      <details className="plans-calendar">
        <summary>
          <span className="plans-calendar__icon"><CalendarDays aria-hidden="true" /></span>
          <span><strong>{t('plansCalendar')}</strong><small>{t('plansCalendarHint')}</small></span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className="plans-calendar__content">
          <form className="plan-form" onSubmit={(event) => {
            event.preventDefault()
            if (!planTitle.trim() || !planDate) return
            addPlan({ title: planTitle.trim(), date: planDate })
            setPlanTitle('')
            setPlanDate('')
          }}>
            {groupedIdeas.added.length > 0 && <label className="plan-form__idea"><span>{t('planFromIdeas')}</span><select value="" onChange={(event) => setPlanTitle(event.target.value)}><option value="">{t('chooseSavedIdea')}</option>{groupedIdeas.added.map(({ idea, partner }) => {
              const label = idea.title ?? t(idea.titleKey as Parameters<typeof t>[0])
              return <option key={`${partner ? 'partner' : 'own'}-${idea.id}`} value={label}>{label}{partner ? ` · ${state.partner.name}` : ''}</option>
            })}</select></label>}
            <label><span>{t('planTitle')}</span><input value={planTitle} maxLength={80} onChange={(event) => setPlanTitle(event.target.value)} /></label>
            <label><span>{t('planDate')}</span><input type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} /></label>
            <button className="primary-small" type="submit" disabled={!planTitle.trim() || !planDate}><Plus aria-hidden="true" />{t('addPlan')}</button>
          </form>
          {allPlans.length ? <ul className="plan-list">{allPlans.map(({ plan, partner }) => <li key={`${partner ? 'partner' : 'own'}-${plan.id}`} className={plan.completed ? 'is-completed' : ''}>
            {partner ? <span className="plan-check read-only">{plan.completed && <Check />}</span> : <button type="button" className="plan-check" aria-label={plan.completed ? t('completed') : t('markCompleted')} onClick={() => togglePlan(plan.id)}>{plan.completed && <Check />}</button>}
            <span className="plan-copy"><strong>{plan.title}</strong><small>{new Intl.DateTimeFormat(state.profile.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${plan.date}T12:00:00`))}{partner ? ` · ${state.partner.name}` : ''}</small></span>
            {!partner && <button type="button" className="plan-delete" aria-label={t('deletePlan')} onClick={() => deletePlan(plan.id)}><Trash2 /></button>}
          </li>)}</ul> : <p className="plans-empty">{t('noPlans')}</p>}
        </div>
      </details>
      <div className="ideas-view-switch" role="group" aria-label={t('ideasViewLabel')}>
        <button type="button" className={view === 'added' ? 'is-active' : ''} aria-pressed={view === 'added'} onClick={() => setView('added')}>{t('addedIdeas')}</button>
        <button type="button" className={view === 'suggested' ? 'is-active' : ''} aria-pressed={view === 'suggested'} onClick={() => setView('suggested')}>{t('suggestedIdeas')}</button>
      </div>
      <div className="filter-row" role="group" aria-label={t('ideasTitle')}>
        {visibleIdeaCategories.map((category) => <button key={category} type="button" aria-pressed={filter === category} className={filter === category ? 'is-active' : ''} onClick={() => setFilter(category)}>{t(category === 'home' ? 'homeCategory' : category)}</button>)}
      </div>
      <div className="idea-list">
        {shown.length === 0 && <div className="ideas-empty"><h2>{t(view === 'added' ? 'noAddedIdeas' : 'noSuggestedIdeas')}</h2><p>{t(view === 'added' ? 'noAddedIdeasHint' : 'noSuggestedIdeasHint')}</p></div>}
        {shown.map(({ idea, partner }) => (
          <article key={`${partner ? 'partner' : 'own'}-${idea.id}`}>
            <div className="idea-copy"><span>{t(displayIdeaCategory(idea.category) === 'home' ? 'homeCategory' : displayIdeaCategory(idea.category))}{partner ? ` · ${state.partner.name}` : ''}</span><h2>{idea.title ?? t(idea.titleKey as Parameters<typeof t>[0])}</h2><p>{idea.description ?? t(idea.descriptionKey as Parameters<typeof t>[0])}</p></div>
            {!partner && <div className="idea-actions"><button type="button" className={idea.saved ? 'is-saved' : ''} aria-pressed={idea.saved} aria-label={idea.saved ? t('removeFavorite') : t('saveIdea')} onClick={() => toggleIdea(idea.id)}>{idea.saved ? <BookmarkCheck /> : <Bookmark />}<span>{idea.saved ? t('saved') : t('save')}</span></button>{idea.custom && <button type="button" className="idea-delete" aria-label={t('deleteIdea')} onClick={() => deleteIdea(idea.id)}><Trash2 /></button>}</div>}
          </article>
        ))}
      </div>
    </div>
  )
}

