import { Check, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { buildMonthGrid, initialPlansCalendarExpanded, shiftMonth } from '../services/plansCalendar'

export function PlansCalendar() {
  const { state, t, addPlan, deletePlan, togglePlan } = useApp()
  const [planTitle, setPlanTitle] = useState('')
  const [planDate, setPlanDate] = useState('')
  const [expanded, setExpanded] = useState(initialPlansCalendarExpanded)
  const today = new Date()
  const [visibleMonth, setVisibleMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const calendarDays = buildMonthGrid(visibleMonth.year, visibleMonth.month)
  const allPlans = [
    ...state.plans.map((plan) => ({ plan, partner: false })),
    ...(state.partnerShared?.plans ?? []).map((plan) => ({ plan, partner: true })),
  ].sort((left, right) => left.plan.date.localeCompare(right.plan.date))
  const locale = state.profile.language === 'ru' ? 'ru-RU' : 'en-US'
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(visibleMonth.year, visibleMonth.month, 1))
  const weekdays = state.profile.language === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  const todayIso = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toLocaleDateString('sv-SE')

  return <section className="plans-calendar" aria-labelledby="plans-calendar-title">
    <div className="plans-calendar__heading">
      <div><h2 id="plans-calendar-title">{t('plansCalendar')}</h2><p>{state.profile.language === 'ru' ? 'Нажмите на дату и добавьте план' : 'Tap a date and add a plan'}</p></div>
      <button type="button" className="plans-calendar__toggle" aria-expanded={expanded} aria-controls="plans-calendar-content" aria-label={expanded ? (state.profile.language === 'ru' ? 'Скрыть календарь' : 'Hide calendar') : (state.profile.language === 'ru' ? 'Открыть календарь' : 'Open calendar')} onClick={() => setExpanded((value) => !value)}><ChevronDown className={expanded ? 'is-open' : ''} /></button>
    </div>
    {expanded && <div id="plans-calendar-content" className="plans-calendar__content-wrap">
    <div className="plans-calendar__month-nav">
      <button type="button" aria-label={state.profile.language === 'ru' ? 'Предыдущий месяц' : 'Previous month'} onClick={() => setVisibleMonth(shiftMonth(visibleMonth.year, visibleMonth.month, -1))}><ChevronLeft /></button>
      <strong>{monthLabel}</strong>
      <button type="button" aria-label={state.profile.language === 'ru' ? 'Следующий месяц' : 'Next month'} onClick={() => setVisibleMonth(shiftMonth(visibleMonth.year, visibleMonth.month, 1))}><ChevronRight /></button>
    </div>
    <div className="plans-calendar__weekdays" aria-hidden="true">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="plans-calendar__grid" role="grid" aria-label={monthLabel}>
      {calendarDays.map((day) => {
        const planCount = allPlans.filter(({ plan }) => plan.date === day.iso).length
        return <button key={day.iso} type="button" role="gridcell" className={`${day.inMonth ? '' : 'is-outside'}${day.iso === planDate ? ' is-selected' : ''}${day.iso === todayIso ? ' is-today' : ''}`} aria-selected={day.iso === planDate} onClick={() => setPlanDate(day.iso)}><span>{day.day}</span>{planCount > 0 && <i aria-label={`${planCount}`}>{planCount}</i>}</button>
      })}
    </div>
    {planDate && <form className="plan-form plan-form--simple" onSubmit={(event) => { event.preventDefault(); if (!planTitle.trim()) return; addPlan({ title: planTitle.trim(), date: planDate }); setPlanTitle(''); setPlanDate('') }}>
      <input aria-label={t('planTitle')} autoFocus value={planTitle} maxLength={80} placeholder={t('planTitle')} onChange={(event) => setPlanTitle(event.target.value)} />
      <button className="primary-small" type="submit" disabled={!planTitle.trim()}><Plus aria-hidden="true" />{t('addPlan')}</button>
    </form>}
    <div className="plans-calendar__plans">
      {allPlans.length ? <ul className="plan-list">{allPlans.map(({ plan, partner }) => <li key={`${partner ? 'partner' : 'own'}-${plan.id}`} className={plan.completed ? 'is-completed' : ''}>
        {partner ? <span className="plan-check read-only">{plan.completed && <Check />}</span> : <button type="button" className="plan-check" aria-label={plan.completed ? t('completed') : t('markCompleted')} onClick={() => togglePlan(plan.id)}>{plan.completed && <Check />}</button>}
        <span className="plan-copy"><strong>{plan.title}</strong><small>{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${plan.date}T12:00:00`))}{partner ? ` · ${state.partner.name}` : ''}</small></span>
        {!partner && <button type="button" className="plan-delete" aria-label={t('deletePlan')} onClick={() => deletePlan(plan.id)}><Trash2 /></button>}
      </li>)}</ul> : <p className="plans-empty">{t('noPlans')}</p>}
    </div>
    </div>}
  </section>
}
